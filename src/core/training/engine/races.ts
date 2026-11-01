import type { Activity } from '../../schemas';
import { RaceSchema, type Race } from '../types';
import { addDays, daysBetween } from './periods';

// Détection de courses (candidates) + débrief et préparation sur 8 semaines.

export const STANDARD_DISTANCES_KM = [5, 10, 15, 21.0975, 42.195, 50] as const;

// « Course à pied (du midi / dans l'après-midi…) » est le titre auto de Strava
// pour toute sortie : « course » seul n'est donc PAS un indice de course.
const RACE_WORDS: RegExp[] = [
  /\bsemis?\b/i,
  /marathons?/i,
  /trail/i,
  /\b10\s?k\b/i,
  /chrono/i,
  /compétition/i,
  /\brace\b/i,
  /foulées?/i,
  /ekiden/i,
];

export interface DetectRacesOptions {
  /** FC max : n'ajoute qu'un motif à `reasons`, ne déclenche jamais une candidate */
  maxHr?: number;
  minDistanceKm?: number;
  /** activités confirmées comme courses par l'utilisateur */
  confirmedIds?: readonly string[];
  /** activités écartées par l'utilisateur */
  rejectedIds?: readonly string[];
}

export type RaceCandidate = Race & {
  confidence: 'high' | 'medium';
  reasons: string[];
};

function nearestStandard(distanceKm: number): number | undefined {
  let best: number | undefined;
  let bestErr = Infinity;
  for (const std of STANDARD_DISTANCES_KM) {
    const err = Math.abs(distanceKm - std) / std;
    if (err < bestErr) {
      bestErr = err;
      best = std;
    }
  }
  return bestErr <= 0.06 ? best : undefined;
}

function nearKm(distanceKm: number, target: number): boolean {
  return Math.abs(distanceKm - target) / target <= 0.06;
}

/**
 * Candidates courses :
 * - course à pied ≥ 19 km à ±6 % de 21,0975 ou 42,195 km → 'high' ;
 * - proche de 5 / 10 / 15 km avec un mot de course dans le nom → 'medium' ;
 * - confirmée par l'utilisateur (`confirmedIds`) → 'high' quelles que soient les distances.
 * `rejectedIds` exclut une candidate. La FC ne déclenche rien : elle ne fait
 * qu'enrichir `reasons`.
 */
export function detectRaces(activities: Activity[], opts: DetectRacesOptions = {}): RaceCandidate[] {
  const minKm = opts.minDistanceKm ?? 8;
  const confirmed = new Set(opts.confirmedIds ?? []);
  const rejected = new Set(opts.rejectedIds ?? []);
  const candidates: RaceCandidate[] = [];

  for (const a of activities) {
    if (rejected.has(a.id)) continue;
    const d = a.distanceKm ?? 0;

    let confidence: 'high' | 'medium' | undefined;
    const reasons: string[] = [];

    if (confirmed.has(a.id)) {
      confidence = 'high';
      reasons.push('confirmée manuellement');
    } else if (a.type !== 'run' || d < minKm) {
      continue;
    } else if (
      d >= 19 &&
      (nearKm(d, 21.0975) || nearKm(d, 42.195))
    ) {
      confidence = 'high';
      reasons.push(`distance compatible ${nearKm(d, 21.0975) ? 'semi-marathon' : 'marathon'}`);
    } else {
      const std = nearestStandard(d);
      const word = std !== undefined && [5, 10, 15].includes(std) ? RACE_WORDS.find((r) => r.test(a.name)) : undefined;
      if (!word) continue;
      confidence = 'medium';
      reasons.push(`nom évocateur : « ${a.name.match(word)![0]} »`);
    }

    if (opts.maxHr !== undefined && a.avgHr !== undefined && a.avgHr >= 0.85 * opts.maxHr) {
      reasons.push('intensité élevée (FC moyenne ≥ 85 % de la FC max)');
    }

    const race = RaceSchema.parse({
      id: `race-${a.id}`,
      name: a.name,
      date: a.date,
      activityId: a.id,
      officialDistanceKm: nearestStandard(d) ?? d,
      measuredDistanceKm: a.traceDistanceKm ?? d,
      timeSec: Math.round(a.durationMin * 60),
      status: 'completed',
    });
    candidates.push({ ...race, confidence, reasons });
  }
  return candidates.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Débrief ──────────────────────────────────────────────────────────────────

export interface PaceBand {
  label: string;
  fromKm: number;
  toKm: number;
  /** allure mesurée (s/km, distance de la trace) */
  paceSec?: number;
  /** allure recalée : paceSec × distance mesurée / distance officielle */
  officialPaceSec?: number;
  avgHr?: number;
}

export interface RaceDebrief {
  race: Race;
  /** allure recalée sur la distance officielle (s/km) */
  officialPaceSec?: number;
  measuredPaceSec?: number;
  bands: PaceBand[];
  halves?: {
    first: { paceSec: number; officialPaceSec: number; avgHr?: number };
    second: { paceSec: number; officialPaceSec: number; avgHr?: number };
  };
  /** dérive cardiaque : FC moyenne 2e moitié − 1re moitié, et allure perdue (recalée) */
  cardiacDrift?: { hrBpm: number; paceSecPerKm: number };
}

function bandStats(
  splits: { km: number; paceSec: number; avgHr?: number }[],
  fromKm: number,
  toKm: number,
): { paceSec?: number; avgHr?: number } {
  let wSum = 0;
  let paceSum = 0;
  let hrSum = 0;
  let hrW = 0;
  let prevKm = 0;
  for (const s of splits) {
    const len = s.km - prevKm;
    const mid = prevKm + len / 2;
    prevKm = s.km;
    if (mid <= fromKm || mid > toKm || len <= 0) continue;
    wSum += len;
    paceSum += s.paceSec * len;
    if (s.avgHr !== undefined) {
      hrSum += s.avgHr * len;
      hrW += len;
    }
  }
  return {
    paceSec: wSum ? Math.round(paceSum / wSum) : undefined,
    avgHr: hrW ? Math.round(hrSum / hrW) : undefined,
  };
}

export function raceDebrief(race: Race, activity: Activity): RaceDebrief {
  const distanceKm = race.officialDistanceKm;
  const measuredKm = race.measuredDistanceKm ?? activity.distanceKm ?? distanceKm;
  const officialRatio = distanceKm > 0 ? measuredKm / distanceKm : 1;
  const measuredPaceSec =
    activity.distanceKm && activity.distanceKm > 0
      ? Math.round((race.timeSec ?? activity.durationMin * 60) / activity.distanceKm)
      : undefined;
  const officialPaceSec =
    race.timeSec !== undefined ? Math.round(race.timeSec / distanceKm) : undefined;

  const splits = activity.splits ?? [];
  const bands: PaceBand[] = [];
  for (let i = 0; i < 4; i++) {
    const fromKm = (distanceKm / 4) * i;
    const toKm = (distanceKm / 4) * (i + 1);
    const { paceSec, avgHr } = bandStats(splits, fromKm, toKm);
    bands.push({
      label: `Q${i + 1}`,
      fromKm,
      toKm,
      paceSec,
      officialPaceSec: paceSec !== undefined ? Math.round(paceSec * officialRatio) : undefined,
      avgHr,
    });
  }

  // Moitiés : le split qui chevauche la borne est réparti proportionnellement.
  const halfKm = distanceKm / 2;
  const firstParts: { len: number; paceSec: number; avgHr?: number }[] = [];
  const secondParts: typeof firstParts = [];
  let prevKm = 0;
  for (const s of splits) {
    const len = s.km - prevKm;
    prevKm = s.km;
    if (len <= 0) continue;
    const firstLen = Math.min(len, Math.max(0, halfKm - (s.km - len)));
    if (firstLen > 0) firstParts.push({ len: firstLen, paceSec: s.paceSec, avgHr: s.avgHr });
    if (len - firstLen > 0) secondParts.push({ len: len - firstLen, paceSec: s.paceSec, avgHr: s.avgHr });
  }
  const avg = (parts: typeof firstParts) => {
    const w = parts.reduce((s, p) => s + p.len, 0);
    const hrW = parts.reduce((s, p) => s + (p.avgHr !== undefined ? p.len : 0), 0);
    return {
      paceSec: w ? Math.round(parts.reduce((s, p) => s + p.paceSec * p.len, 0) / w) : undefined,
      avgHr: hrW ? Math.round(parts.reduce((s, p) => s + (p.avgHr ?? 0) * (p.avgHr !== undefined ? p.len : 0), 0) / hrW) : undefined,
    };
  };
  const first = avg(firstParts);
  const second = avg(secondParts);
  const halves =
    first.paceSec !== undefined && second.paceSec !== undefined
      ? {
          first: { paceSec: first.paceSec, officialPaceSec: Math.round(first.paceSec * officialRatio), avgHr: first.avgHr },
          second: { paceSec: second.paceSec, officialPaceSec: Math.round(second.paceSec * officialRatio), avgHr: second.avgHr },
        }
      : undefined;

  const cardiacDrift =
    halves?.first.avgHr !== undefined && halves?.second.avgHr !== undefined
      ? {
          hrBpm: halves.second.avgHr - halves.first.avgHr,
          paceSecPerKm: halves.second.officialPaceSec - halves.first.officialPaceSec,
        }
      : undefined;

  return { race, officialPaceSec, measuredPaceSec, bands, halves, cardiacDrift };
}

// ─── Préparation sur 8 semaines ───────────────────────────────────────────────

export interface PrepWeek {
  /** dates de début et de fin (YYYY-MM-DD, incluses) */
  key: string;
  from: string;
  to: string;
  distanceKm: number;
  sessions: number;
  longestRunKm: number;
  /** la fenêtre chevauche l'historique (sinon elle ne compte pas dans emptyWeeks) */
  covered: boolean;
}

export interface RacePrep {
  raceId: string;
  /** 8 fenêtres de 7 jours, de la plus ancienne à la veille de la course */
  weeks: PrepWeek[];
  totalKm: number;
  /** totalKm / 8 */
  avgKmPerWeek: number;
  /** sorties ≥ 15 km ou ≥ 70 % de la distance de course */
  longRuns: number;
  /** fenêtres couvertes sans séance */
  emptyWeeks: number;
  /** jours de la fenêtre effectivement couverts par l'historique (≤ 56) */
  coveredDays: number;
  /** false si l'historique commence après le début de la fenêtre */
  complete: boolean;
  /** fenêtre −1..−7 vs moyenne des 7 autres (affûtage) */
  taper?: { lastWeekKm: number; priorAvgKm: number; dropPct: number };
}

export function racePrep(activities: Activity[], race: Race, weekCount = 8): RacePrep {
  const longRunKm = Math.max(15, race.officialDistanceKm * 0.7);
  const sortedDates = activities.map((a) => a.date).sort();
  const firstDate = sortedDates[0] ?? race.date;
  const windowStart = addDays(race.date, -weekCount * 7);

  const weeks: PrepWeek[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const from = addDays(race.date, -7 * (i + 1));
    const to = addDays(race.date, -7 * i - 1);
    weeks.push({
      key: from,
      from,
      to,
      distanceKm: 0,
      sessions: 0,
      longestRunKm: 0,
      covered: to >= firstDate,
    });
  }

  let longRuns = 0;
  for (const a of activities) {
    if (a.type !== 'run' || a.date < windowStart || a.date >= race.date) continue;
    const w = weeks.find((wk) => a.date >= wk.from && a.date <= wk.to);
    if (!w) continue;
    const d = a.distanceKm ?? 0;
    w.distanceKm += d;
    w.sessions++;
    w.longestRunKm = Math.max(w.longestRunKm, Math.round(d * 100) / 100);
    if (d >= longRunKm) longRuns++;
  }
  for (const w of weeks) w.distanceKm = Math.round(w.distanceKm * 100) / 100;

  const totalKm = Math.round(weeks.reduce((s, w) => s + w.distanceKm, 0) * 100) / 100;
  const emptyWeeks = weeks.filter((w) => w.covered && w.sessions === 0).length;
  const coveredDays = Math.min(weekCount * 7, Math.max(0, daysBetween(firstDate, race.date)));
  const complete = firstDate <= windowStart;

  const last = weeks[weeks.length - 1];
  const prior = weeks.slice(0, -1);
  const priorAvgKm = prior.reduce((s, w) => s + w.distanceKm, 0) / prior.length;
  const taper =
    priorAvgKm > 0
      ? {
          lastWeekKm: last.distanceKm,
          priorAvgKm: Math.round(priorAvgKm * 100) / 100,
          dropPct: Math.round(((priorAvgKm - last.distanceKm) / priorAvgKm) * 1000) / 10,
        }
      : undefined;

  return {
    raceId: race.id,
    weeks,
    totalKm,
    avgKmPerWeek: Math.round((totalKm / weekCount) * 100) / 100,
    longRuns,
    emptyWeeks,
    coveredDays,
    complete,
    taper,
  };
}
