/**
 * Vérifie le regroupement en séances sur le snapshot local (outil de dev).
 *
 *   npm run check:sessions -- [--snapshot fixtures/julien.snapshot.json]
 *
 * Affiche :
 *   - nombre d'activités dans le snapshot
 *   - nombre de doublons écartés par la déduplication
 *   - nombre de séances résultantes
 *   - regroupements de plus d'une activité (date, famille, nombre, durée)
 *   - paires de même famille du même jour avec un écart entre 15 et 30 minutes
 */

import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { ActivitySchema, type Activity } from '../src/core/schemas';
import { dedupeActivities } from '../src/core/training/import/dedupeActivities';
import { groupSessions } from '../src/core/training/sessions';

// ─── Résolution des arguments ────────────────────────────────────────────────

const DEFAULT_SNAPSHOT = 'fixtures/julien.snapshot.json';

function resolveArgs(argv: string[]): { snapshotPath: string } {
  const args = argv.slice(2);
  const snapIdx = args.indexOf('--snapshot');
  const snapshotPath = snapIdx >= 0 ? (args[snapIdx + 1] ?? DEFAULT_SNAPSHOT) : DEFAULT_SNAPSHOT;
  return { snapshotPath };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startMs(a: Activity): number {
  if (a.startedAt) return Date.parse(a.startedAt);
  return Date.parse(`${a.date}T${a.startTime ?? '00:00:00'}`);
}

function endMs(a: Activity): number {
  return startMs(a) + a.durationMin * 60 * 1000;
}

function localDate(ms: number, tz: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date(ms));
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { snapshotPath } = resolveArgs(process.argv);

  if (!existsSync(snapshotPath)) {
    console.error(`Snapshot introuvable : ${snapshotPath}`);
    console.error('Usage : npm run check:sessions -- [--snapshot <chemin>]');
    process.exit(1);
  }

  // ── Chargement et validation ────────────────────────────────────────────
  const raw = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as unknown;
  const parsed = z.array(ActivitySchema).safeParse(raw);

  if (!parsed.success) {
    console.error('Snapshot invalide :');
    console.error(parsed.error.issues.slice(0, 5).map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'));
    process.exit(1);
  }

  const activities = parsed.data;
  console.log(`\n📋 Snapshot : ${snapshotPath}`);
  console.log(`   Activités brutes    : ${activities.length}`);

  // ── Déduplication ────────────────────────────────────────────────────────
  const { kept, discarded } = dedupeActivities(activities);
  console.log(`   Doublons écartés    : ${discarded.length}`);
  console.log(`   Après déduplication : ${kept.length}`);

  // ── Regroupement en séances ───────────────────────────────────────────────
  const { sessions, ignoredMergeOverrides } = groupSessions(kept, []);
  console.log(`   Séances résultantes : ${sessions.length}`);

  if (ignoredMergeOverrides.length > 0) {
    console.log(`   Overrides merge ignorés : ${ignoredMergeOverrides.length}`);
  }

  // ── Regroupements de plus d'une activité ─────────────────────────────────
  const multiSessions = sessions.filter((s) => s.activityIds.length > 1);
  if (multiSessions.length === 0) {
    console.log('\n📦 Aucun regroupement de plus d\'une activité.');
  } else {
    console.log(`\n📦 Regroupements de plus d'une activité (${multiSessions.length}) :`);
    console.log('   Date         Famille    Acti.  Durée totale');
    console.log('   ' + '─'.repeat(50));
    for (const s of multiSessions) {
      const firstAct = kept.find((a) => a.id === s.activityIds[0]);
      const date = firstAct ? s.startedAt.slice(0, 10) : '?';
      const sport = s.sport.padEnd(10);
      const count = String(s.activityIds.length).padStart(5);
      const dur = fmtDuration(s.elapsedTimeSec);
      console.log(`   ${date}  ${sport} ${count}  ${dur}`);
    }
  }

  // ── Paires avec écart 15–30 min (même famille, même jour) ────────────────
  const TZ = 'Europe/Paris';
  const actById = new Map<string, Activity>(kept.map((a) => [a.id, a]));

  interface NearMissPair {
    date: string;
    sport: string;
    gap: number;
    idA: string;
    idB: string;
  }

  const nearMisses: NearMissPair[] = [];

  // Pour chaque séance, comparer la fin de sa dernière activité avec le début
  // des activités d'autres séances du même jour et de la même famille
  const sortedActs = [...kept].sort((a, b) => startMs(a) - startMs(b));

  for (let i = 0; i < sortedActs.length; i++) {
    const a = sortedActs[i];
    const aEnd = endMs(a);
    const aDay = localDate(startMs(a), TZ);

    for (let j = i + 1; j < sortedActs.length; j++) {
      const b = sortedActs[j];
      if (b.type !== a.type) continue;

      const bStart = startMs(b);
      const bDay = localDate(bStart, TZ);
      if (bDay !== aDay) break; // trié chronologiquement, pas la peine de continuer

      const gapMin = (bStart - aEnd) / 60000;
      if (gapMin < 0) continue; // chevauchement
      if (gapMin > 30) continue; // trop loin
      if (gapMin <= 15) continue; // déjà groupé

      nearMisses.push({
        date: aDay,
        sport: a.type,
        gap: Math.round(gapMin * 10) / 10,
        idA: a.id,
        idB: b.id,
      });
    }
  }

  if (nearMisses.length === 0) {
    console.log('\n⏱  Aucune paire avec écart 15–30 min.');
  } else {
    console.log(`\n⏱  Paires avec écart 15–30 min (${nearMisses.length}) :`);
    console.log('   Date         Famille    Écart');
    console.log('   ' + '─'.repeat(40));
    for (const p of nearMisses) {
      const sport = p.sport.padEnd(10);
      const actA = actById.get(p.idA);
      const actB = actById.get(p.idB);
      const extra =
        actA && actB
          ? `  (${actA.startTime ?? '?'} → ${actB.startTime ?? '?'})`
          : '';
      console.log(`   ${p.date}  ${sport} ${p.gap} min${extra}`);
    }
    console.log('\n  → Ces paires ne sont PAS regroupées (écart > 15 min).');
    console.log('    Ajuster GROUP_MAX_GAP_MIN si nécessaire.');
  }

  console.log('');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
