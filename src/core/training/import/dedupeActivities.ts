import type { Activity } from '../../schemas';
import { DEDUPE_DISTANCE_PCT, DEDUPE_START_DIFF_MIN } from '../insights/thresholds';

export type DedupeResult = {
  kept: Activity[];
  discarded: Activity[];
};

/** Résolution des familles de sport pour la déduplication (même logique que groupSessions). */
function sportFamily(type: Activity['type']): string {
  return type; // chaque type est sa propre famille
}

/**
 * Priorité de source (plus haut = prioritaire).
 * Strava est toujours battu par n'importe quelle autre source.
 */
const SOURCE_PRIORITY: Record<Activity['source'], number> = {
  coros: 3,
  garmin: 3,
  apple_health: 2,
  health_connect: 2,
  file: 1,
  phone: 0,
  manual: -1,
  strava: -99,
};

/** Nombre de points de données présents (FC, tours, trace) — départage à priorité égale. */
function dataRichness(a: Activity): number {
  return (a.hrStream?.length ?? 0) + (a.splits?.length ?? 0) + (a.polyline?.length ?? 0);
}

/** Timestamp de début en ms (utilise startedAt si disponible, sinon date+startTime). */
function startMs(a: Activity): number {
  if (a.startedAt) return Date.parse(a.startedAt);
  // Approximation locale (sans fuseau) ; suffisant pour comparer deux activités
  return Date.parse(`${a.date}T${a.startTime ?? '00:00:00'}`);
}

/** Vrai si A et B représentent la même sortie selon les seuils. */
function isSameSession(a: Activity, b: Activity): boolean {
  // Doit être de la même famille de sport
  if (sportFamily(a.type) !== sportFamily(b.type)) return false;

  // Mêmes source → jamais fusionnés
  if (a.source === b.source) return false;

  // Écart de départ ≤ 2 min
  const diffMin = Math.abs(startMs(a) - startMs(b)) / 60000;
  if (diffMin >= DEDUPE_START_DIFF_MIN) return false;

  // Distance ≤ 3 % (ou durée si les deux n'ont pas de distance)
  const da = a.distanceKm;
  const db = b.distanceKm;
  if (da !== undefined && db !== undefined) {
    const ref = Math.max(da, db);
    if (ref === 0) return true; // deux activités sans distance → doublon
    return Math.abs(da - db) / ref <= DEDUPE_DISTANCE_PCT / 100;
  }
  if (da === undefined && db === undefined) {
    // Fallback : durée écoulée
    const ref = Math.max(a.durationMin, b.durationMin);
    if (ref === 0) return true;
    return Math.abs(a.durationMin - b.durationMin) / ref <= DEDUPE_DISTANCE_PCT / 100;
  }
  // L'un a une distance et l'autre non : pas le même enregistrement
  return false;
}

/**
 * Choisit lequel des deux enregistrements conserver.
 * Règle : non-Strava bat toujours Strava. À égalité de rang, plus de données l'emporte.
 * Aucun champ de la copie Strava ne complète l'enregistrement gardé.
 */
function choose(a: Activity, b: Activity): { keep: Activity; drop: Activity } {
  const pa = SOURCE_PRIORITY[a.source];
  const pb = SOURCE_PRIORITY[b.source];
  if (pa > pb) return { keep: a, drop: b };
  if (pb > pa) return { keep: b, drop: a };
  // Même rang → plus de données
  return dataRichness(a) >= dataRichness(b)
    ? { keep: a, drop: b }
    : { keep: b, drop: a };
}

/**
 * Déduplique un tableau d'activités.
 *
 * Deux activités sont la même sortie si : même famille de sport, départ à moins de
 * `DEDUPE_START_DIFF_MIN` minutes, distance à moins de `DEDUPE_DISTANCE_PCT` % (ou durée si
 * aucune n'a de distance). Deux enregistrements de la même source ne sont jamais fusionnés.
 *
 * Retourne `kept` (les enregistrements conservés) et `discarded` (ceux écartés).
 * Fonction pure, déterministe, sans mutation de l'entrée.
 */
export function dedupeActivities(activities: readonly Activity[]): DedupeResult {
  // Tri stable par date de début pour un résultat déterministe quel que soit l'ordre d'entrée
  const sorted = [...activities].sort((a, b) => startMs(a) - startMs(b) || a.id.localeCompare(b.id));

  const kept: Activity[] = [];
  const addedToKept = new Set<string>(); // ids déjà ajoutés à kept (évite les doublons si winner promu)
  const discarded = new Set<string>(); // ids écartés

  for (let i = 0; i < sorted.length; i++) {
    if (discarded.has(sorted[i].id) || addedToKept.has(sorted[i].id)) continue;

    let winner = sorted[i];

    // Compare avec les activités suivantes proches (même jour environ)
    for (let j = i + 1; j < sorted.length; j++) {
      if (discarded.has(sorted[j].id) || addedToKept.has(sorted[j].id)) continue;
      // Optimisation : si l'écart de départ dépasse déjà 2 min, les suivantes seront encore plus loin
      if ((startMs(sorted[j]) - startMs(winner)) / 60000 >= DEDUPE_START_DIFF_MIN) break;
      if (isSameSession(winner, sorted[j])) {
        const { keep, drop } = choose(winner, sorted[j]);
        winner = keep;
        discarded.add(drop.id);
      }
    }

    addedToKept.add(winner.id);
    kept.push(winner);
  }

  return {
    kept,
    discarded: sorted.filter((a) => discarded.has(a.id)),
  };
}
