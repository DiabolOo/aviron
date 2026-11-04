import type { Activity } from '../../schemas';
import { GROUP_MAX_DURATION_H, GROUP_MAX_GAP_MIN } from '../insights/thresholds';
import type {
  GroupOverride,
  GroupSessionsOptions,
  GroupSessionsResult,
  MergeOverride,
  Session,
} from './types';

// ─── Helpers de temps ────────────────────────────────────────────────────────

/** Instant de début en ms (utilise startedAt si disponible, sinon date+startTime). */
function startMs(a: Activity): number {
  if (a.startedAt) return Date.parse(a.startedAt);
  return Date.parse(`${a.date}T${a.startTime ?? '00:00:00'}`);
}

/** Instant de fin en ms : début + durée écoulée. */
function endMs(a: Activity): number {
  return startMs(a) + a.durationMin * 60 * 1000;
}

/** Date locale (YYYY-MM-DD) dans le fuseau donné. */
function localDate(ms: number, tz: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date(ms));
}

/** ISO offset de début à partir d'un timestamp ms. */
function toIso(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

// ─── Construction d'une Session ──────────────────────────────────────────────

function buildSession(
  activities: Activity[],
  roles?: Record<string, 'warmup' | 'main' | 'cooldown'>,
): Session {
  // Tri chronologique garanti
  const sorted = [...activities].sort((a, b) => startMs(a) - startMs(b) || a.id.localeCompare(b.id));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const movingTimeSec = sorted.reduce((s, a) => s + (a.movingTimeSec ?? a.durationMin * 60), 0);
  const elapsedTimeSec = (endMs(last) - startMs(first)) / 1000;

  const distanceM = (() => {
    const total = sorted.reduce((s, a) => s + (a.distanceKm ?? 0), 0);
    return sorted.some((a) => a.distanceKm !== undefined) ? Math.round(total * 1000) : undefined;
  })();

  const avgHr = (() => {
    const withHr = sorted.filter((a) => a.avgHr !== undefined && a.avgHr > 0);
    if (!withHr.length) return undefined;
    const totalTime = withHr.reduce((s, a) => s + (a.movingTimeSec ?? a.durationMin * 60), 0);
    if (totalTime === 0) return undefined;
    const weighted = withHr.reduce(
      (s, a) => s + a.avgHr! * (a.movingTimeSec ?? a.durationMin * 60),
      0,
    );
    return Math.round(weighted / totalTime);
  })();

  return {
    id: `s_${first.id}`,
    sport: first.type,
    familySport: first.type,
    startedAt: toIso(startMs(first)),
    endedAt: toIso(endMs(last)),
    activityIds: sorted.map((a) => a.id),
    movingTimeSec,
    elapsedTimeSec,
    distanceM,
    avgHr,
    aiEligible: sorted.every((a) => a.aiEligible),
    ...(roles && Object.keys(roles).length > 0 ? { roles } : {}),
  };
}

// ─── Groupement ──────────────────────────────────────────────────────────────

/**
 * Groupe un tableau d'activités en séances.
 *
 * Règles (SPEC-v3, section Séances) :
 * 1. Même famille de sport (jamais multisport).
 * 2. Écart entre fin(A) et début(B) ≤ GROUP_MAX_GAP_MIN (15 min).
 * 3. Même jour LOCAL (timezone en paramètre, défaut Europe/Paris).
 * 4. Durée totale (premier début → dernière fin) ≤ GROUP_MAX_DURATION_H (4 h).
 * 5. Pas d'override split sur ces activités.
 * 6. Chaîné : A→B→C avec A→B ≤ 15 min et B→C ≤ 15 min → une séance.
 *
 * Overrides (persistés séparément, appliqués ici) :
 * - split : cette activité commence une nouvelle séance.
 * - merge : force le regroupement indépendamment de l'écart et du jour (même famille obligatoire).
 * - role : attribue un rôle à une activité dans sa séance.
 *
 * options.neverGroup : désactive tout regroupement automatique (les merge restent appliqués).
 *
 * Fonction pure, déterministe, sans mutation.
 */
export function groupSessions(
  activities: readonly Activity[],
  overrides: readonly GroupOverride[] = [],
  options: GroupSessionsOptions = {},
): GroupSessionsResult {
  const tz = options.timezone ?? 'Europe/Paris';
  const neverGroup = options.neverGroup ?? false;

  // ── Index des overrides ──────────────────────────────────────────────────
  const splitIds = new Set<string>();
  const mergeOverrides: MergeOverride[] = [];
  const roleOverrides = new Map<string, 'warmup' | 'main' | 'cooldown'>();

  for (const ov of overrides) {
    if (ov.type === 'split') splitIds.add(ov.activityId);
    else if (ov.type === 'merge') mergeOverrides.push(ov);
    else if (ov.type === 'role') roleOverrides.set(ov.activityId, ov.role);
  }

  // ── Tri chronologique ────────────────────────────────────────────────────
  const sorted = [...activities].sort(
    (a, b) => startMs(a) - startMs(b) || a.id.localeCompare(b.id),
  );

  const idToActivity = new Map<string, Activity>(sorted.map((a) => [a.id, a]));

  // ── Fusion forcée (merge) ────────────────────────────────────────────────
  // Pour chaque merge, si toutes les activités ont la même famille, on les pré-groupe.
  const ignoredMergeOverrides: MergeOverride[] = [];
  // mergeGroupOf : id → group id (premier id des activités du merge, trié)
  const mergeGroupOf = new Map<string, string>();

  for (const mo of mergeOverrides) {
    const acts = mo.activityIds.map((id) => idToActivity.get(id)).filter(Boolean) as Activity[];
    if (acts.length < 2) {
      ignoredMergeOverrides.push(mo);
      continue;
    }
    // Vérification même famille
    const families = new Set(acts.map((a) => a.type));
    if (families.size > 1) {
      ignoredMergeOverrides.push(mo);
      continue;
    }
    const sortedMerge = [...acts].sort(
      (a, b) => startMs(a) - startMs(b) || a.id.localeCompare(b.id),
    );
    const groupId = sortedMerge[0].id;
    for (const a of sortedMerge) mergeGroupOf.set(a.id, groupId);
  }

  // ── neverGroup : chaque activité est sa propre séance ─────────────────
  if (neverGroup) {
    // Les merge-overrides restent cependant appliqués
    // On regroupe d'abord par merge-group, puis une séance par activité
    const processed = new Set<string>();
    const sessions: Session[] = [];

    for (const a of sorted) {
      if (processed.has(a.id)) continue;
      const mg = mergeGroupOf.get(a.id);
      if (mg !== undefined) {
        // Groupe merge : toutes les activités de ce groupe
        const groupActs = sorted.filter((x) => mergeGroupOf.get(x.id) === mg);
        for (const x of groupActs) processed.add(x.id);
        const roles = buildRoles(groupActs.map((x) => x.id), roleOverrides);
        sessions.push(buildSession(groupActs, roles));
      } else {
        processed.add(a.id);
        const roles = buildRoles([a.id], roleOverrides);
        sessions.push(buildSession([a], roles));
      }
    }
    return { sessions, ignoredMergeOverrides };
  }

  // ── Regroupement automatique ─────────────────────────────────────────────
  const sessions: Session[] = [];
  const processed = new Set<string>();

  // Groupes merge : traités en bloc avant l'algorithme chaîné
  const mergeGroups = new Map<string, Activity[]>();
  for (const a of sorted) {
    const mg = mergeGroupOf.get(a.id);
    if (mg !== undefined) {
      if (!mergeGroups.has(mg)) mergeGroups.set(mg, []);
      mergeGroups.get(mg)!.push(a);
    }
  }

  // Algorithme chaîné
  for (const a of sorted) {
    if (processed.has(a.id)) continue;

    // Si cette activité appartient à un merge-group, traiter tout le groupe d'un coup
    const mg = mergeGroupOf.get(a.id);
    if (mg !== undefined) {
      const groupActs = mergeGroups.get(mg)!;
      for (const x of groupActs) processed.add(x.id);
      const roles = buildRoles(groupActs.map((x) => x.id), roleOverrides);
      sessions.push(buildSession(groupActs, roles));
      continue;
    }

    // Commence une nouvelle séance avec `a`
    processed.add(a.id);
    let chain: Activity[] = [a];
    let chainEnd = endMs(a);

    // Split override : cette activité est isolée de la précédente — mais on continue le chaînage
    // avec la suivante normalement.

    // Tente d'étendre la chaîne avec les activités suivantes
    for (const b of sorted) {
      if (processed.has(b.id)) continue;
      if (mergeGroupOf.has(b.id)) continue; // les merge-groups sont traités séparément

      // Même famille de sport
      if (b.type !== a.type) continue;

      // Split override sur b : b ouvre une nouvelle séance
      if (splitIds.has(b.id)) break;

      // Même jour local
      const aDay = localDate(startMs(chain[0]), tz);
      const bDay = localDate(startMs(b), tz);
      if (aDay !== bDay) {
        // Si b est dans un jour suivant, les suivantes le seront aussi
        if (startMs(b) > endMs(chain[chain.length - 1])) break;
        continue;
      }

      // Écart ≤ GROUP_MAX_GAP_MIN
      const gapMin = (startMs(b) - chainEnd) / 60000;
      if (gapMin > GROUP_MAX_GAP_MIN) break; // trié par début → les suivants seront encore plus loin
      if (gapMin < 0) continue; // chevauchement : on ignore (ne devrait pas arriver après dedupe)

      // Durée totale ≤ GROUP_MAX_DURATION_H
      const totalSec = (endMs(b) - startMs(chain[0])) / 1000;
      if (totalSec > GROUP_MAX_DURATION_H * 3600) break;

      // Ajout à la chaîne
      processed.add(b.id);
      chain.push(b);
      chainEnd = Math.max(chainEnd, endMs(b));
    }

    const roles = buildRoles(chain.map((x) => x.id), roleOverrides);
    sessions.push(buildSession(chain, roles));
  }

  return { sessions, ignoredMergeOverrides };
}

function buildRoles(
  ids: string[],
  roleOverrides: Map<string, 'warmup' | 'main' | 'cooldown'>,
): Record<string, 'warmup' | 'main' | 'cooldown'> | undefined {
  const roles: Record<string, 'warmup' | 'main' | 'cooldown'> = {};
  for (const id of ids) {
    const role = roleOverrides.get(id);
    if (role) roles[id] = role;
  }
  return Object.keys(roles).length > 0 ? roles : undefined;
}
