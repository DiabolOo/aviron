/**
 * Bench « ouverture du détail » — mesure le coût des données dérivées sur le
 * snapshot réel (fixtures/julien.snapshot.json), hors rendu RN.
 *
 *   npx tsx scripts/bench-derived.ts
 *
 * AVANT : chaque hook recalculait (mapping stravaToActivity + detectUserRaces ×3,
 * buildRaceDebriefView → re-détection, highlightOf → re-balayage de l'historique).
 * APRÈS : sportDerived calcule une fois par version du snapshot ; l'ouverture ne
 * fait que des lectures mémoïsées (débrief, moment fort).
 */
import { readFileSync } from 'node:fs';

import type { Activity } from '../src/core/schemas';
import { comparablesIndex, highlightOf, highlightOfIndexed, type HighlightActivity } from '../src/core/training/highlights';
import { buildRaceDebriefView, buildRaceDebriefViewFromRaces, detectUserRaces, isConfirmed } from '../src/core/training/raceView';
import type { StravaActivity } from '../src/core/types';
import { activityToStrava, stravaToActivity } from '../src/data/mappers';

const CHOICES = { confirmedIds: [] as string[], rejectedIds: [] as string[], names: {} };
const ITER = 50;

const time = (label: string, fn: () => void) => {
  fn(); // chauffe le JIT
  const t0 = performance.now();
  for (let i = 0; i < ITER; i++) fn();
  console.log(`${label} : ${((performance.now() - t0) / ITER).toFixed(2)} ms / appel`);
};

const raw: { activities: Activity[] } = JSON.parse(readFileSync('fixtures/julien.snapshot.json', 'utf8'));
const storeActivities: StravaActivity[] = raw.activities.map(activityToStrava);
const last = storeActivities[0];

/** Ce que faisait l'écran de détail AVANT : 3 hooks → 3 mappings + 3 détections + debrief + highlight. */
const before = () => {
  const acts1 = storeActivities.map(stravaToActivity);
  const races = detectUserRaces(acts1, CHOICES); // useConfirmedRaceMap
  const map = new Map<string, string>();
  for (const r of races) if (r.activityId && isConfirmed(r, CHOICES.confirmedIds)) map.set(r.activityId, r.id);
  const acts2 = storeActivities.map(stravaToActivity);
  buildRaceDebriefView(acts2, CHOICES, map.get(last.id) ?? 'race-x'); // useRaceDebrief (re-détection interne)
  const acts3 = storeActivities.map(stravaToActivity);
  detectUserRaces(acts3, CHOICES); // useRaceInsights (Accueil monté en dessous)
  highlightOf(last, storeActivities); // moment fort : balayage complet
};

/** APRÈS : le snapshot dérivé existe déjà (Accueil/Suivi montés) → lectures mémoïsées. */
const derivedActivities = storeActivities.map(stravaToActivity);
const derivedRaces = detectUserRaces(derivedActivities, CHOICES);
const derivedMap = new Map<string, string>();
for (const r of derivedRaces) if (r.activityId && isConfirmed(r, CHOICES.confirmedIds)) derivedMap.set(r.activityId, r.id);
const index = comparablesIndex(storeActivities as unknown as HighlightActivity[]);

const after = () => {
  const raceId = derivedMap.get(last.id);
  buildRaceDebriefViewFromRaces(derivedActivities, derivedRaces, CHOICES, raceId ?? 'race-x');
  highlightOfIndexed(last, index);
};

/** Coût d'une version de snapshot (payé une fois, au chargement / à la synchro). */
const buildDerived = () => {
  const acts = storeActivities.map(stravaToActivity);
  detectUserRaces(acts, CHOICES);
  comparablesIndex(storeActivities as unknown as HighlightActivity[]);
};

console.log(`${storeActivities.length} activités, ${derivedRaces.length} courses détectées\n`);
time('AVANT  — ouverture détail (3 hooks + highlight)', before);
time('APRÈS — ouverture détail (dérivé partagé)', after);
time('      — coût d’une version de snapshot', buildDerived);
