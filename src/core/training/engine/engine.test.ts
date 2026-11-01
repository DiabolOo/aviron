import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Activity } from '../../schemas';
import {
  aerobicEfficiency,
  addDays,
  detectRaces,
  daysBetween,
  hrZones,
  intensityDistribution,
  monthlyVolume,
  quarterKey,
  raceDebrief,
  racePrep,
  regularity,
  shareAboveHr,
  weekKey,
  weeklyVolume,
  zoneOf,
  estimateMaxHr,
} from './index';

function run(id: string, date: string, distanceKm: number, min: number, avgHr?: number): Activity {
  return {
    id, name: 'Sortie', type: 'run', date, startTime: '08:00',
    durationMin: min, distanceKm, calories: 0, avgHr,
  };
}

/** |actual − expected| ≤ 3 % de expected (arrondi aux entiers). */
function near3(actual: number | undefined, expected: number) {
  expect(actual).toBeDefined();
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(expected * 0.03);
}

describe('periods', () => {
  it('computes ISO week, month, quarter keys', () => {
    expect(weekKey('2025-03-02')).toBe('2025-W09'); // dimanche
    expect(weekKey('2025-03-03')).toBe('2025-W10'); // lundi
    expect(weekKey('2024-01-01')).toBe('2024-W01');
    expect(weekKey('2023-12-31')).toBe('2023-W52');
    expect(quarterKey('2025-11-01')).toBe('2025-Q4');
    expect(daysBetween('2025-03-01', '2025-03-10')).toBe(9);
    expect(addDays('2025-03-10', -9)).toBe('2025-03-01');
  });

  it('aggregates weekly and monthly volume', () => {
    const acts = [run('1', '2025-03-02', 10, 50), run('2', '2025-03-05', 12, 60), run('3', '2025-04-01', 8, 40)];
    const weeks = weeklyVolume(acts, { types: ['run'] });
    expect(weeks.map((w) => [w.key, w.sessions])).toEqual([['2025-W09', 1], ['2025-W10', 1], ['2025-W14', 1]]);
    const months = monthlyVolume(acts);
    expect(months.find((m) => m.key === '2025-03')!.distanceKm).toBe(22);
  });
});

describe('regularity', () => {
  it('counts active weeks and gaps', () => {
    const acts = [run('1', '2025-03-03', 8, 40), run('2', '2025-03-04', 8, 40), run('3', '2025-03-30', 8, 40)];
    const r = regularity(acts);
    expect(r.totalWeeks).toBe(4);
    expect(r.activeWeeks).toBe(2);
    expect(r.longestGapDays).toBe(25);
    expect(r.gaps).toEqual([{ from: '2025-03-04', to: '2025-03-30', days: 25 }]);
  });
});

describe('zones & intensity', () => {
  it('builds zones from a configurable max HR', () => {
    const zones = hrZones(200);
    expect(zones[0]).toEqual({ zone: 1, minBpm: 100, maxBpm: 119 });
    expect(zones[4]).toEqual({ zone: 5, minBpm: 180, maxBpm: 201 });
    expect(zoneOf(165, zones)).toBe(4);
    expect(estimateMaxHr(35)).toBe(184); // 208 − 24,5
  });

  it('shares sessions above a HR threshold, excluding no-HR outings', () => {
    const acts = [run('1', '2025-03-01', 10, 50, 170), run('2', '2025-03-02', 10, 50, 150), run('3', '2025-03-03', 10, 50)];
    const s = shareAboveHr(acts, 160, { types: ['run'], minDistanceKm: 5 });
    expect(s).toEqual({ above: 1, total: 2, pct: 50 });
  });

  it('distributes intensity by zone', () => {
    const acts = [run('1', '2025-03-01', 10, 50, 110), run('2', '2025-03-02', 10, 50, 190)];
    const r = intensityDistribution(acts, { maxHr: 200 });
    expect(r.considered).toBe(2);
    expect(r.byZone.find((z) => z.zone === 1)!.pct).toBe(50);
    expect(r.byZone.find((z) => z.zone === 5)!.pct).toBe(50);
  });

  it('returns null pcts (not NaN) for a beginner profile without HR', () => {
    const acts = Array.from({ length: 6 }, (_, i) => run(`b${i}`, `2025-03-0${i + 1}`, 6, 40));
    const r = intensityDistribution(acts, { types: ['run'], minDistanceKm: 5, maxHr: 200 });
    expect(r.considered).toBe(0);
    expect(r.avgHr).toBeUndefined();
    expect(r.byZone.every((z) => z.pct === null)).toBe(true);
    expect(r.byTime.every((z) => z.pct === null)).toBe(true);
  });
});

describe('efficiency', () => {
  it('computes aerobic efficiency per quarter with a reliability flag', () => {
    // 10 km en 50 min = 200 m/min ; à 160 bpm → EF 1,25
    const q = aerobicEfficiency([run('1', '2025-01-10', 10, 50, 160), run('2', '2025-04-10', 10, 50, 100)]);
    expect(q).toHaveLength(2);
    expect(q[0]).toMatchObject({ quarter: '2025-Q1', sessions: 1, ef: 1.25, avgPaceSecPerKm: 300, reliable: false });
    expect(q[1]).toMatchObject({ quarter: '2025-Q2', ef: 2, reliable: false });
  });

  it('uses moving time over elapsed time when present', () => {
    // 10 km en 60 min écoulées dont 10 min de pause → EF calculé sur 50 min.
    const a = run('1', '2025-01-10', 10, 60, 150);
    const withMoving = { ...a, movingTimeSec: 50 * 60 };
    const q = aerobicEfficiency([withMoving]);
    expect(q[0].avgPaceSecPerKm).toBe(300); // 5:00/km, pas 6:00
    expect(q[0].ef).toBeCloseTo(10000 / 50 / 150, 3);
  });

  it('marks a quarter reliable from 3 runs > 5 km with HR', () => {
    const acts = [1, 2, 3].map((i) => run(`r${i}`, `2025-01-0${i}`, 10, 50, 150));
    expect(aerobicEfficiency(acts)[0].reliable).toBe(true);
  });
});

describe('races', () => {
  const raceAct: Activity = {
    ...run('r1', '2025-10-12', 21.34, 110.83, 174),
    name: 'Semi Reims',
    splits: Array.from({ length: 22 }, (_, i) => ({
      km: i < 21 ? i + 1 : 21.34,
      paceSec: i < 11 ? 300 : 330,
      pace: i < 11 ? '5:00' : '5:30',
      elevationGain: 0,
      avgHr: i < 11 ? 165 : 180,
    })),
  };
  const acts = [
    raceAct,
    run('e1', '2025-08-25', 32, 170, 140),
    run('e2', '2025-09-01', 25, 130, 140),
    run('e4', '2025-09-20', 19, 100, 145),
    run('e3', '2025-10-10', 10, 50, 150),
    { ...run('w1', '2025-10-11', 8, 40), type: 'ride' as const },
  ];

  it('returns high-confidence candidates on standard distances', () => {
    const races = detectRaces(acts, { maxHr: 201 });
    // e1/e2/e4 : sorties longues hors distances officielles → pas candidates
    expect(races).toHaveLength(1);
    expect(races[0]).toMatchObject({
      name: 'Semi Reims',
      officialDistanceKm: 21.0975,
      measuredDistanceKm: 21.34,
      timeSec: 6650,
      status: 'completed',
      confidence: 'high',
    });
    expect(races[0].reasons[0]).toMatch(/semi-marathon/);
    expect(races[0].reasons.join(' ')).toMatch(/intensité élevée/);
  });

  it('detects named short races as medium and honors confirmed/rejected ids', () => {
    const list = [
      { ...run('n1', '2025-06-01', 10.2, 50, 150), name: '10k de Paris' },
      run('n2', '2025-06-08', 10.1, 50, 150), // « Sortie » : pas de mot de course
    ];
    const c = detectRaces(list);
    expect(c).toHaveLength(1);
    expect(c[0].confidence).toBe('medium');
    expect(detectRaces(list, { rejectedIds: ['n1'] })).toHaveLength(0);
    const confirmed = detectRaces(list, { confirmedIds: ['n2'] });
    expect(confirmed.find((c) => c.activityId === 'n2')).toMatchObject({ confidence: 'high' });
  });

  it('21 km sans mot de course : « high » si l’allure suit l’entraînement, « medium » sinon', () => {
    const base = [1, 2, 3].map((i) => run(`b${i}`, `2025-08-0${i}`, 12, 66)); // 5:30/km
    const slow = { ...run('s1', '2025-10-12', 21.3, 128), name: 'Long run' }; // 6:00/km > +5 %
    const fast = { ...run('s2', '2025-10-12', 21.3, 110), name: 'Morning Run' }; // 5:10/km
    const named = { ...run('s3', '2025-10-12', 21.3, 128), name: 'Semi de Reims' };
    const found = detectRaces([...base, slow, fast, named]);
    expect(found.find((r) => r.activityId === 's1')).toMatchObject({ confidence: 'medium' });
    expect(found.find((r) => r.activityId === 's2')).toMatchObject({ confidence: 'high' });
    expect(found.find((r) => r.activityId === 's3')).toMatchObject({ confidence: 'high' });
    // moins de 3 sorties de référence : rien n'infirme, la distance seule suffit
    expect(detectRaces([slow, fast])[0].confidence).toBe('high');
  });

  it('debriefs pace, HR halves and cardiac drift', () => {
    const race = detectRaces(acts, { maxHr: 201 })[0];
    const d = raceDebrief(race, raceAct);
    expect(d.officialPaceSec).toBe(Math.round(6650 / 21.0975)); // ≈ 5:15/km
    expect(d.bands).toHaveLength(4);
    expect(d.bands[0].paceSec).toBe(300);
    // recalage : paceSec × 21,34 / 21,0975
    expect(d.bands[0].officialPaceSec).toBe(Math.round(300 * (21.34 / 21.0975)));
    expect(d.halves!.first.avgHr).toBe(165);
    expect(d.halves!.second.avgHr).toBe(179);
    expect(d.cardiacDrift).toEqual({ hrBpm: 14, paceSecPerKm: 30 });
  });

  it('notes measured vs official distance only when the gap is >= 1 %', () => {
    const race = detectRaces(acts, { maxHr: 201 })[0];
    const d = raceDebrief(race, raceAct);
    expect(d.distance).toMatchObject({ measuredKm: 21.34, officialKm: 21.0975, gapPct: 1.1 });
    const exact = raceDebrief({ ...race, measuredDistanceKm: 21.0975 }, raceAct);
    expect(exact.distance).toBeUndefined();
  });

  it('debriefs a no-HR race without throwing', () => {
    const noHr: Activity = { ...raceAct, id: 'r2', splits: raceAct.splits!.map((s) => ({ ...s, avgHr: undefined })) };
    const race = detectRaces([noHr], { confirmedIds: ['r2'] })[0];
    const d = raceDebrief(race, noHr);
    expect(d.halves!.first.avgHr).toBeUndefined();
    expect(d.cardiacDrift).toBeUndefined();
  });

  it('summarizes the 8 rolling weeks before a race', () => {
    const race = detectRaces(acts, { maxHr: 201 })[0];
    const p = racePrep(acts, race);
    expect(p.weeks).toHaveLength(8);
    expect(p.weeks[0].from).toBe('2025-08-17');
    expect(p.weeks[7]).toMatchObject({ from: '2025-10-05', to: '2025-10-11' });
    expect(p.longRuns).toBe(3); // 32, 25 et 19 km
    expect(p.totalKm).toBeCloseTo(86, 1);
    // l'historique commence le 2025-08-25, après le début de la fenêtre (2025-08-17)
    expect(p.complete).toBe(false);
    expect(p.coveredDays).toBe(48);
    expect(p.taper!.lastWeekKm).toBe(10);
    expect(p.taper!.dropPct).toBeGreaterThan(0); // affûtage : dernière semaine allégée
  });
});

// ─── Données réelles (snapshot gitignoré — test sauté si absent) ─────────────

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const snapshot: { activities: Activity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

(snapshot ? describe : describe.skip)('real Strava export', () => {
  const acts = snapshot!.activities;
  const runs = acts.filter((a) => a.type === 'run');
  const races = detectRaces(acts, { maxHr: 201 });
  const byDate = (d: string) => races.find((r) => r.date === d)!;
  const actOf = (d: string) => acts.find((a) => a.date === d && a.type === 'run')!;

  it('matches reference values', () => {
    const s = shareAboveHr(acts, 160, { types: ['run'], minDistanceKm: 5 });
    expect(s).toEqual({ above: 26, total: 49, pct: 53.1 });
    expect(Math.max(...acts.map((a) => a.maxHr ?? 0))).toBe(201);
    expect(acts.filter((a) => a.avgHr === undefined)).toHaveLength(30);
  });

  it('computes yearly and monthly run volume', () => {
    const year = (y: string) => runs.filter((a) => a.date.startsWith(y));
    for (const [y, km, n] of [
      ['2024', 331.7, 35],
      ['2025', 203.1, 24],
      ['2026', 263.2, 30],
    ] as const) {
      const acts = year(y);
      expect(acts).toHaveLength(n);
      expect(acts.reduce((s, a) => s + (a.distanceKm ?? 0), 0)).toBeCloseTo(km, 0);
    }
    const months = monthlyVolume(runs);
    expect(Math.abs(months.find((m) => m.key === '2024-03')!.distanceKm - 79)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(months.find((m) => m.key === '2026-10')!.distanceKm - 47)).toBeLessThanOrEqual(0.5);
  });

  it('finds the 127-day gap', () => {
    const r = regularity(runs);
    expect(r.longestGapDays).toBe(127);
    expect(r.gaps.find((g) => g.days === 127)).toMatchObject({ from: '2025-04-07', to: '2025-08-13' });
  });

  it('detects the 4 half-marathons (3 high, 1 medium) plus the triathlon leg', () => {
    expect(races).toHaveLength(5);
    // « Morning Run » : 21,3 km sans mot de course et 13 % plus lente que la médiane
    // d'entraînement → candidate moyenne, pas « high »
    expect(byDate('2024-10-13')).toMatchObject({ confidence: 'medium' });
    expect(byDate('2024-10-13').reasons.join(' ')).toMatch(/allure plus lente/);
    for (const [date, timeSec] of [
      ['2024-03-03', 6496], // Semi de Paris — 1h48:16
      ['2024-10-13', 7730], // « Morning Run » — sortie longue probable, 2h08:50, FC moy. 153
      ['2025-10-12', 6650], // Semi Reims — 1h50:50
      ['2026-10-11', 6789], // Semi Reims — 1h53:09
    ] as const) {
      expect(byDate(date)).toMatchObject({ timeSec, officialDistanceKm: 21.0975 });
    }
    // partie course d'un triathlon (~10 km) : candidate marquée multisport, jamais comparée
    expect(races.find((r) => r.date === '2024-04-28')).toMatchObject({ confidence: 'medium', multisport: true });
    // ni les footings ~10 km sans mot de course, ni l'affûtage de 4,6 km
    const absent = ['2024-03-19', '2024-03-26', '2024-11-15', '2026-02-17', '2026-04-30', '2026-05-12', '2026-10-09'];
    expect(races.filter((r) => absent.includes(r.date))).toHaveLength(0);
  });

  it('splits race pace into official-distance quartiles', () => {
    const measured: Record<string, number[]> = {
      '2024-03-03': [279, 308, 307, 298],
      '2024-10-13': [347, 363, 359, 379],
      '2025-10-12': [294, 307, 310, 332],
      '2026-10-11': [340, 308, 312, 285],
    };
    const official: Record<string, number[]> = {
      '2024-03-03': [287, 317, 316, 307],
      '2025-10-12': [297, 311, 314, 336],
      '2026-10-11': [355, 322, 326, 298],
    };
    const hrs: Record<string, number[]> = { '2024-10-13': [155, 154, 154, 152] };
    for (const date of Object.keys(measured)) {
      const d = raceDebrief(byDate(date), actOf(date));
      measured[date].forEach((v, i) => near3(d.bands[i].paceSec, v));
      (official[date] ?? []).forEach((v, i) => near3(d.bands[i].officialPaceSec, v));
      (hrs[date] ?? []).forEach((v, i) => near3(d.bands[i].avgHr, v));
    }
  });

  it('measures cardiac drift on Reims 2025', () => {
    const d = raceDebrief(byDate('2025-10-12'), actOf('2025-10-12'));
    expect(d.cardiacDrift!.hrBpm).toBeGreaterThanOrEqual(10);
    expect(d.cardiacDrift!.hrBpm).toBeLessThanOrEqual(14);
    expect(d.cardiacDrift!.paceSecPerKm).toBeGreaterThanOrEqual(18);
    expect(d.cardiacDrift!.paceSecPerKm).toBeLessThanOrEqual(26);
  });

  it('computes aerobic efficiency per quarter', () => {
    const q = aerobicEfficiency(acts, { types: ['run'] });
    const ef = (k: string) => q.find((x) => x.quarter === k)!.ef!;
    expect(ef('2026-Q2') / ef('2024-Q1')).toBeGreaterThanOrEqual(0.87);
    expect(ef('2026-Q2') / ef('2024-Q1')).toBeLessThanOrEqual(0.93);
  });

  it('imported 166 activities: 137 with splits, 30 without HR', () => {
    expect(acts).toHaveLength(166);
    expect(acts.filter((a) => a.splits?.length)).toHaveLength(137);
    expect(acts.filter((a) => a.avgHr === undefined)).toHaveLength(30);
    const noSplits = acts.filter((a) => !a.splits?.length);
    expect(noSplits).toHaveLength(29);
    expect(noSplits.every((a) => a.type === 'other')).toBe(true); // les muscu n'ont pas de GPS mais elles ont une FC
    // 165 fichiers lus / 1 en erreur et la répartition FIT 137 / GPX 28 sont des statistiques
    // de console du script d'import : le snapshot ne les conserve pas.
  });

  it('summarizes each race build', () => {
    const paris24 = racePrep(acts, byDate('2024-03-03'));
    expect(paris24.complete).toBe(false); // historique depuis le 2024-02-20
    expect(paris24.coveredDays).toBe(12);

    const reims24 = racePrep(acts, byDate('2024-10-13'));
    expect(reims24.totalKm).toBeCloseTo(28.3, 0);
    expect(reims24.weeks.reduce((s, w) => s + w.sessions, 0)).toBe(6);
    expect(Math.max(...reims24.weeks.map((w) => w.longestRunKm))).toBeCloseTo(7.9, 0);
    expect(reims24.avgKmPerWeek).toBeCloseTo(3.5, 0);

    const reims25 = racePrep(acts, byDate('2025-10-12'));
    expect(reims25.totalKm).toBeCloseTo(28.6, 0);
    expect(reims25.weeks.reduce((s, w) => s + w.sessions, 0)).toBe(3);
    expect(Math.max(...reims25.weeks.map((w) => w.longestRunKm))).toBeCloseTo(13.1, 0);
    expect(reims25.avgKmPerWeek).toBeCloseTo(3.6, 0);

    const reims26 = racePrep(acts, byDate('2026-10-11'));
    expect(reims26.totalKm).toBeCloseTo(37.3, 0);
    expect(reims26.weeks.reduce((s, w) => s + w.sessions, 0)).toBe(5);
    expect(Math.max(...reims26.weeks.map((w) => w.longestRunKm))).toBeCloseTo(9.2, 0);
    expect(reims26.avgKmPerWeek).toBeCloseTo(4.7, 0);
  });
});
