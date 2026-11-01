import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { Activity } from '../schemas';
import { detectRaces } from './engine';
import {
  activityIdOfRace,
  buildRaceDebriefView,
  candidateSummaryFr,
  comparisonLabel,
  formatKmRange,
  formatPaceKm,
  formatRaceDelta,
  formatRaceTime,
  raceSummary,
  suggestRaceName,
} from './raceView';

const NONE = { confirmedIds: [], rejectedIds: [] };

function semi(id: string, date: string, durationMin: number, distanceKm: number, withHr: boolean): Activity {
  const splits = Array.from({ length: 22 }, (_, i) => ({
    km: Math.min(i + 1, distanceKm),
    pace: '5:15',
    paceSec: i < 11 ? 300 : 330,
    elevationGain: 2,
    avgHr: withHr ? (i < 11 ? 165 : 179) : undefined,
  }));
  return {
    id, name: 'Semi Reims', type: 'run', date, startTime: '09:00', durationMin, distanceKm,
    avgHr: withHr ? 172 : undefined, splits,
  };
}

describe('format helpers', () => {
  it('formats race time, pace and delta', () => {
    expect(formatRaceTime(6650)).toBe('1h50:50');
    expect(formatRaceTime(6789)).toBe('1h53:09');
    expect(formatRaceTime(3005)).toBe('50:05');
    expect(formatPaceKm(315)).toBe('5:15');
    expect(formatRaceDelta(-18 * 60)).toBe('−18 min');
    expect(formatRaceDelta(45)).toBe('+45 s');
    expect(formatRaceDelta(0)).toBe('=');
    expect(activityIdOfRace('race-row-47')).toBe('row-47');
    expect(formatKmRange(0, 5.27)).toBe('0 → 5,3');
    expect(formatKmRange(10.5, 15.8)).toBe('10,5 → 15,8');
  });

  it('propose un nom pré-rempli', () => {
    expect(suggestRaceName({ officialDistanceKm: 21.0975, date: '2024-10-13' })).toBe('Semi-marathon du 13 octobre 2024');
    expect(suggestRaceName({ officialDistanceKm: 10, date: '2025-03-02' })).toBe('10 km du 2 mars 2025');
    expect(
      suggestRaceName({ officialDistanceKm: 21.0975, date: '2024-10-13', startCity: 'Reims' }),
    ).toBe('Semi-marathon de Reims 2024');
    expect(suggestRaceName({ officialDistanceKm: 10, date: '2025-03-02', startCity: 'Melun' })).toBe(
      '10 km de Melun 2025',
    );
  });

  it('compose la ligne « À confirmer »', () => {
    expect(
      candidateSummaryFr({
        date: '2024-10-13',
        startTime: '08:46:19',
        startCity: 'Reims',
        officialDistanceKm: 21.0975,
        measuredDistanceKm: 21.289,
        timeSec: 7730,
      }),
    ).toBe('dimanche 13 octobre 2024 · 08:46 · Reims · 21,3 km · 2h08:50');
    expect(candidateSummaryFr({ date: '2024-10-13', officialDistanceKm: 21.0975, timeSec: 7730 })).toBe(
      'dimanche 13 octobre 2024 · 21,1 km · 2h08:50',
    );
  });
});

describe('buildRaceDebriefView', () => {
  const acts = [
    semi('a24', '2024-03-03', 108.2667, 21.671, false),
    semi('a25', '2025-10-12', 110.8333, 21.336, true),
    semi('a26', '2026-10-11', 113.15, 21.876, false),
  ];
  const all = { confirmedIds: ['a24', 'a25', 'a26'], rejectedIds: [] };

  it('returns undefined for an unknown race', () => {
    expect(buildRaceDebriefView(acts, NONE, 'race-nope')).toBeUndefined();
    expect(buildRaceDebriefView(acts, { confirmedIds: [], rejectedIds: ['a25'] }, 'race-a25')).toBeUndefined();
  });

  it('with HR: time, official pace, bands, halves and drift', () => {
    const v = buildRaceDebriefView(acts, all, 'race-a25')!;
    expect(formatRaceTime(v.timeSec!)).toBe('1h50:50');
    expect(formatPaceKm(v.officialPaceSec!)).toBe('5:15');
    expect(v.bands).toHaveLength(4);
    expect(v.bands.every((b) => b.avgHr !== undefined)).toBe(true);
    expect(v.hr?.halves.second.avgHr).toBeGreaterThan(v.hr!.halves.first.avgHr!);
    expect(v.hr?.driftSentence).toBe('Ta FC a grimpé de 13 bpm en 2e moitié : ton endurance a été le facteur limitant.');
    expect(v.distanceNote?.short).toMatch(/\+1,1 %/);
  });

  it('without HR: no halves/drift, distance note at +3.7 %', () => {
    const v = buildRaceDebriefView(acts, all, 'race-a26')!;
    expect(formatRaceTime(v.timeSec!)).toBe('1h53:09');
    expect(v.hr).toBeUndefined();
    expect(v.bands).toHaveLength(4);
    expect(v.distanceNote?.short).toContain('+3,7 %');
    expect(v.distanceNote?.short).not.toContain('\n');
    expect(v.distanceNote?.detail).toContain('trajectoire');
    expect(v.distanceNote?.detail).toContain('précision du GPS');
  });

  it('FC stable et allure qui baisse → phrase de fatigue musculaire', () => {
    const steady = acts.map((a) =>
      a.id === 'a25' ? { ...a, splits: a.splits!.map((sp, i) => ({ ...sp, avgHr: 170 + (i < 11 ? 0 : 1) })) } : a,
    );
    const v = buildRaceDebriefView(steady, all, 'race-a25')!;
    expect(v.hr?.driftSentence).toMatch(/^Ta FC est restée stable alors que tu as ralenti de \d+ s\/km : plutôt de la fatigue musculaire/);
  });

  it('race_pacing : ajoute la plus longue sortie des 8 semaines et l’allure nécessaire à l’objectif', () => {
    const long: Activity = { id: 'long', name: 'Sortie longue', type: 'run', date: '2026-09-20', startTime: '08:00', durationMin: 140, distanceKm: 24.3 };
    const goal = { type: 'race_prep' as const, targetName: 'Semi-marathon', targetValue: '1h45', weeklySessionsCount: 4 };
    const v = buildRaceDebriefView([...acts, long], all, 'race-a26', undefined, goal)!;
    expect(v.pacing?.message).toBeTruthy();
    expect(v.pacing?.extras).toEqual([
      'Plus longue sortie des 8 semaines avant la course : 24,3 km (115 % de la distance).',
      'Allure nécessaire pour ton objectif (1h45) : 4:59 /km.',
    ]);
    const other = buildRaceDebriefView([...acts, long], all, 'race-a26', undefined, { ...goal, targetName: '10 km' })!;
    expect(other.pacing?.extras).toEqual(['Plus longue sortie des 8 semaines avant la course : 24,3 km (115 % de la distance).']);
  });

  it('tranches et moitiés suivent le temps écoulé (arrêts compris)', () => {
    const withStop = acts.map((a) =>
      a.id === 'a26' ? { ...a, splits: a.splits!.map((sp, i) => (i === 5 ? { ...sp, paceSec: 330, elapsedPaceSec: 500 } : sp)) } : a,
    );
    const v = buildRaceDebriefView(withStop, all, 'race-a26')!;
    const moving = buildRaceDebriefView(acts, all, 'race-a26')!;
    expect(v.bands[1].officialPaceSec).toBeGreaterThan(moving.bands[1].officialPaceSec!);
    expect(v.bands.reduce((s, b) => s + (b.timeSec ?? 0), 0)).toBeCloseTo(v.timeSec!, 5);
  });

  it('résumé de course : chrono, allure officielle, distances ; moment fort = écart avec l’an dernier', () => {
    const v = buildRaceDebriefView(acts, all, 'race-a26')!;
    const r = raceSummary(v);
    expect(formatRaceTime(r.timeSec!)).toBe('1h53:09');
    expect(formatPaceKm(r.officialPaceSec!)).toBe('5:22');
    expect(r.officialKm).toBeCloseTo(21.0975);
    expect(r.measuredKm).toBeCloseTo(21.876);
    // 2e moitié plus lente : pas de « seconde moitié plus rapide »
    expect(r.highlight).toMatchObject({ kind: 'race_vs_last_year', tone: 'accent', value: '+2 min' });
    expect(r.highlight?.title).toBe('Par rapport à l’an dernier (1h50:50)');
  });

  it('moment fort de course : 2e moitié plus rapide en priorité ; rien sans donnée', () => {
    const fast = acts.map((a) =>
      a.id === 'a25' ? { ...a, splits: a.splits!.map((sp, i) => ({ ...sp, paceSec: i < 11 ? 330 : 300 })) } : a,
    );
    const h = raceSummary(buildRaceDebriefView(fast, all, 'race-a25')!).highlight;
    expect(h).toMatchObject({ kind: 'race_negative_split', tone: 'accent' });
    expect(h?.value).toMatch(/^−\d+ s\/km$/);
    // une seule course : pas d'an dernier, 2e moitié plus lente → pas de moment fort
    const alone = raceSummary(buildRaceDebriefView(acts, { confirmedIds: ['a26'], rejectedIds: [] }, 'race-a26')!);
    expect(alone.highlight).toBeNull();
  });

  it('compares with previous confirmed races of the same distance, flags the best', () => {
    const v = buildRaceDebriefView(acts, all, 'race-a26')!;
    expect(v.comparison.map((r) => r.raceId)).toEqual(['race-a26', 'race-a25', 'race-a24']);
    expect(v.comparison[0].deltaSec).toBe(Math.round(113.15 * 60) - Math.round(110.8333 * 60));
    expect(v.comparison[2].deltaSec).toBeUndefined();
    expect(v.comparison.filter((r) => r.best).map((r) => r.raceId)).toEqual(['race-a24']);
    expect(v.comparison.find((r) => r.current)?.raceId).toBe('race-a26');
  });

  it('comparaison : seules les courses de même distance officielle sont listées', () => {
    const tenK = { ...semi('k10', '2025-05-04', 48, 10.1, false), name: '10k de Melun' };
    const v = buildRaceDebriefView([...acts, tenK], { ...all, confirmedIds: [...all.confirmedIds, 'k10'] }, 'race-a26')!;
    expect(v.comparison.map((r) => r.raceId)).toEqual(['race-a26', 'race-a25', 'race-a24']);
  });

  it('multisport : une partie course de triathlon n’entre jamais dans les comparaisons d’un 10 km', () => {
    const tri = { ...semi('tri', '2025-05-04', 48, 10.2, false), name: 'Triathlon M Cepoy' };
    const tri2 = { ...semi('tri2', '2026-05-03', 46, 10.1, false), name: 'Triathlon du Léon' };
    const tenK = { ...semi('k10', '2025-06-01', 47, 10.1, false), name: '10k de Melun' };
    const tenK2 = { ...semi('k10b', '2026-06-01', 45, 10.0, false), name: '10k de Paris' };
    const list = [tri, tri2, tenK, tenK2];
    const detected = detectRaces(list);
    expect(detected.find((r) => r.id === 'race-tri')).toMatchObject({ confidence: 'medium', multisport: true });
    const choices = { confirmedIds: ['tri', 'tri2', 'k10', 'k10b'], rejectedIds: [] };
    const triathlonView = buildRaceDebriefView(list, choices, 'race-tri2')!;
    const roadView = buildRaceDebriefView(list, choices, 'race-k10b')!;
    expect(triathlonView.comparison.map((r) => r.raceId)).toEqual(['race-tri2', 'race-tri']);
    expect(roadView.comparison.map((r) => r.raceId)).toEqual(['race-k10b', 'race-k10']);
  });

  it('marathon : tranches sur 42,195 km, comparaison entre marathons seulement', () => {
    const marathon = (id: string, date: string, durationMin: number): Activity => ({
      id, name: 'Marathon de Paris', type: 'run', date, startTime: '08:00', durationMin, distanceKm: 42.3,
      splits: Array.from({ length: 43 }, (_, i) => ({ km: Math.min(i + 1, 42.3), pace: '5:30', paceSec: 330, elevationGain: 1 })),
    });
    const list = [marathon('m1', '2024-04-07', 232), marathon('m2', '2025-04-06', 225)];
    const v = buildRaceDebriefView([...acts, ...list], { confirmedIds: ['a24', 'a25', 'a26', 'm1', 'm2'], rejectedIds: [] }, 'race-m2')!;
    expect(v.race.officialDistanceKm).toBeCloseTo(42.195);
    expect(v.bands).toHaveLength(4);
    expect(formatKmRange(v.bands[3].fromKm, v.bands[3].toKm)).toBe('31,6 → 42,2');
    expect(v.comparison.map((r) => r.raceId)).toEqual(['race-m2', 'race-m1']);
    expect(v.comparison[0].deltaSec).toBe(Math.round(225 * 60) - Math.round(232 * 60));
    expect(v.comparison[0].best).toBe(true);
    expect(comparisonLabel(v.race.officialDistanceKm)).toBe('Tes marathons');
    expect(comparisonLabel(10)).toBe('Tes 10 km');
  });

  it('FC partielle : bpm sur les tranches couvertes, pas de moitiés ni de dérive sans FC des deux côtés', () => {
    const partial = acts.map((a) =>
      a.id === 'a25'
        ? { ...a, splits: a.splits!.map((sp, i) => ({ ...sp, avgHr: i < 10 ? sp.avgHr : undefined })) }
        : a,
    );
    const v = buildRaceDebriefView(partial, all, 'race-a25')!;
    expect(v.bands[0].avgHr).toBeDefined();
    expect(v.bands[1].avgHr).toBeDefined();
    expect(v.bands[2].avgHr).toBeUndefined();
    expect(v.hr).toBeUndefined();
  });

  it('ignores unconfirmed races in the comparison', () => {
    const v = buildRaceDebriefView(acts, { confirmedIds: ['a26'], rejectedIds: [] }, 'race-a26')!;
    expect(v.comparison).toEqual([]);
  });
});

const snapshotPath = path.join(__dirname, '../../../fixtures/julien.snapshot.json');
const snapshot: { activities: Activity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

(snapshot ? describe : describe.skip)('real Strava export', () => {
  const choices = { confirmedIds: ['row-160', 'row-47', 'row-2'], rejectedIds: [] };
  const view = (id: string) => buildRaceDebriefView(snapshot!.activities, choices, `race-${id}`)!;

  it('Reims 2025 → 1h50:50, 5:15 /km, with HR', () => {
    const v = view('row-47');
    expect(formatRaceTime(v.timeSec!)).toBe('1h50:50');
    expect(formatPaceKm(v.officialPaceSec!)).toBe('5:15');
    expect(v.hr).toBeDefined();
  });

  it('Reims 2026 → 1h53:09, +3.7 % distance note, no HR', () => {
    const v = view('row-2');
    expect(formatRaceTime(v.timeSec!)).toBe('1h53:09');
    expect(v.distanceNote?.short).toContain('+3,7 %');
    expect(v.hr).toBeUndefined();
  });

  it('Paris 2024 has no HR either', () => {
    expect(view('row-160').hr).toBeUndefined();
  });

  it('Paris 2024 : tranches sur le temps écoulé, leur somme redonne 1h48:16', () => {
    const v = view('row-160');
    expect(v.bands).toHaveLength(4);
    const sum = v.bands.reduce((s, b) => s + (b.timeSec ?? 0), 0);
    expect(formatRaceTime(sum)).toBe('1h48:16');
  });
});
