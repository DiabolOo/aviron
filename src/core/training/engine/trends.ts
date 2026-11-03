import type { Activity } from '../../schemas';
import {
  INTENSITY_MIN_RUN_KM,
  INTENSITY_MIN_RUNS,
  INTENSITY_WINDOW_WEEKS,
} from '../insights/thresholds';
import { intensityDistribution } from './intensity';
import { addDays, daysBetween, monthKey, weekKey, weeklyVolume } from './periods';
import { estimateMaxHr } from './zones';

// Tendances de l'onglet Stats › Sport. Calculs purs ; chaque série dit si elle a assez de données.

export const VOLUME_WEEKS = 8;
export const EFFICIENCY_MONTHS = 6;
/** Sorties plus courtes : la FC moyenne reflète surtout l'échauffement. */
export const EFFICIENCY_MIN_RUN_KM = 3;
/** Mois « fiable » : au moins 3 sorties avec FC (même seuil que l'efficacité trimestrielle). */
export const EFFICIENCY_MIN_RUNS_PER_MONTH = 3;
/** Il faut deux mois exploitables pour comparer. */
export const EFFICIENCY_MIN_RELIABLE_MONTHS = 2;
/** En dessous de ±2 %, la variation est du bruit. */
export const EFFICIENCY_FLAT_PCT = 2;
/** Volume : il faut au moins 2 semaines actives pour parler de tendance. */
export const VOLUME_MIN_ACTIVE_WEEKS = 2;

export interface VolumeWeek {
  /** lundi de la semaine (YYYY-MM-DD) */
  start: string;
  km: number;
  minutes: number;
  sessions: number;
  /** semaine en cours : incomplète, exclue des moyennes */
  current: boolean;
}

export interface VolumeTrend {
  status: 'ok' | 'insufficient';
  weeks: VolumeWeek[];
  /** début (lundi de la 1re semaine) et fin (date de référence) de la fenêtre affichée */
  from: string;
  to: string;
  /** moyenne des semaines terminées */
  avgKm: number;
  avgMinutes: number;
}

export interface IntensityTrend {
  /** noMaxHr : FC max inconnue (ni configurée, ni âge) — on n'invente pas de zones */
  status: 'ok' | 'insufficient' | 'noMaxHr';
  zones: { zone: 1 | 2 | 3 | 4 | 5; pct: number }[];
  /** sorties à pied de la fenêtre avec FC (celles qui comptent) */
  runs: number;
  /** sorties à pied de plus de 5 km sur la fenêtre, avec ou sans FC */
  candidates: number;
  /** minimum de sorties avec FC pour afficher une répartition */
  required: number;
  /** part du temps compté estimée par FC moyenne de sortie (vs flux FC) */
  estimatedPct: number;
  /** début de la fenêtre de 12 semaines */
  from: string;
  maxHr?: number;
  maxHrSource?: MaxHrSource;
}

export interface EfficiencyPoint {
  month: string;
  runs: number;
  ef: number;
  reliable: boolean;
}

export interface EfficiencyTrend {
  status: 'ok' | 'insufficient';
  points: EfficiencyPoint[];
  /** mois exploitables (assez de sorties avec FC) sur la fenêtre */
  reliableMonths: number;
  /** mois exploitables nécessaires pour une tendance */
  requiredMonths: number;
  direction?: 'up' | 'flat' | 'down';
  /** variation entre les deux derniers mois fiables */
  deltaPct?: number;
}

export interface SportTrends {
  /** dernière course avec FC jamais enregistrée (undefined si aucune) */
  lastHrDate?: string;
  /** aucune course de plus de 5 km avec FC sur la fenêtre des intensités (12 semaines) :
   *  intensités et efficacité sont masquées. Une course courte avec FC ne suffit pas à les réafficher. */
  hrAbsent: boolean;
  /** date de référence des calculs : aujourd'hui, ou la dernière activité si la semaine en cours est vide */
  asOf: string;
  /** vrai si `asOf` est antérieure à la semaine en cours (aucune activité récente) */
  stale: boolean;
  volume: VolumeTrend;
  intensity: IntensityTrend;
  efficiency: EfficiencyTrend;
}

export type MaxHrSource = 'configured' | 'observed' | 'estimated';

export interface ResolvedMaxHr {
  maxHr: number;
  source: MaxHrSource;
}

/** Fenêtre de la FC max observée : 12 mois glissants. */
export const OBSERVED_MAX_HR_DAYS = 365;

/** Écart maximal (bpm) entre deux sorties pour que la plus haute FC max soit « confirmée ». */
export const OBSERVED_MAX_HR_TOLERANCE = 3;

/** Bornes de la FC max saisie ou retenue. */
export const MAX_HR_MIN = 100;
export const MAX_HR_MAX = 230;

/**
 * FC max observée sur la fenêtre, filtrée au niveau des activités (le flux de FC est souvent absent).
 * La plus haute valeur n'est retenue que si une autre activité distincte la confirme à 3 bpm près ;
 * sinon (pic isolé, capteur aberrant) on prend la deuxième plus haute. Une seule activité : rien.
 */
export function observedMaxHr(activities: Activity[], today: string, windowDays = OBSERVED_MAX_HR_DAYS): number | undefined {
  const from = addDays(today, -windowDays);
  const values = activities
    .filter((a) => a.date >= from && a.date <= today && a.maxHr !== undefined && a.maxHr > 0)
    .map((a) => a.maxHr as number)
    .sort((x, y) => y - x);
  if (values.length < 2) return undefined;
  return values[0] - values[1] <= OBSERVED_MAX_HR_TOLERANCE ? values[0] : values[1];
}

/** Saisie de la FC max : entier entre 100 et 230, sinon null. */
export function parseMaxHrInput(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n >= MAX_HR_MIN && n <= MAX_HR_MAX ? n : null;
}

/** Priorité : valeur saisie > observée sur 12 mois (filtrée) > Tanaka depuis l'âge ; sinon rien. */
export function resolveMaxHr(input: {
  configuredMaxHr?: number;
  activities?: Activity[];
  today?: string;
  ageYears?: number;
}): ResolvedMaxHr | undefined {
  if (input.configuredMaxHr) return { maxHr: input.configuredMaxHr, source: 'configured' };
  const observed =
    input.activities && input.today ? observedMaxHr(input.activities, input.today) : undefined;
  if (observed !== undefined) return { maxHr: observed, source: 'observed' };
  if (input.ageYears) return { maxHr: estimateMaxHr(input.ageYears), source: 'estimated' };
  return undefined;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function mondayOf(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  return addDays(date, 1 - day);
}

export function volumeTrend(
  activities: Activity[],
  today: string,
  weeks = VOLUME_WEEKS,
  currentIsPartial = true,
): VolumeTrend {
  const currentStart = mondayOf(today);
  const firstStart = addDays(currentStart, -7 * (weeks - 1));
  const byKey = new Map(weeklyVolume(activities, { from: firstStart, to: today }).map((w) => [w.key, w]));
  const list: VolumeWeek[] = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(firstStart, 7 * i);
    const v = byKey.get(weekKey(start));
    return {
      start,
      km: round1(v?.distanceKm ?? 0),
      minutes: Math.round(v?.durationMin ?? 0),
      sessions: v?.sessions ?? 0,
      current: currentIsPartial && start === currentStart,
    };
  });
  const done = list.filter((w) => !w.current);
  const active = list.filter((w) => w.sessions > 0).length;
  const avg = (pick: (w: VolumeWeek) => number) =>
    done.length ? done.reduce((s, w) => s + pick(w), 0) / done.length : 0;
  return {
    status: active >= VOLUME_MIN_ACTIVE_WEEKS ? 'ok' : 'insufficient',
    weeks: list,
    from: firstStart,
    to: today,
    avgKm: round1(avg((w) => w.km)),
    avgMinutes: Math.round(avg((w) => w.minutes)),
  };
}

export function intensityTrend(activities: Activity[], today: string, maxHr?: ResolvedMaxHr): IntensityTrend {
  const from = addDays(today, -7 * INTENSITY_WINDOW_WEEKS + 1);
  const window = activities.filter((a) => a.date >= from && a.date <= today);
  const candidates = window.filter((a) => a.type === 'run' && (a.distanceKm ?? 0) >= INTENSITY_MIN_RUN_KM).length;
  const counts = { candidates, required: INTENSITY_MIN_RUNS, from, estimatedPct: 100 };
  if (!maxHr) return { status: 'noMaxHr', zones: [], runs: 0, ...counts };
  const report = intensityDistribution(window, {
    types: ['run'],
    minDistanceKm: INTENSITY_MIN_RUN_KM,
    maxHr: maxHr.maxHr,
  });
  const base = { runs: report.considered, maxHr: maxHr.maxHr, maxHrSource: maxHr.source, ...counts };
  if (report.considered < INTENSITY_MIN_RUNS) return { ...base, status: 'insufficient', zones: [] };
  return {
    ...base,
    status: 'ok',
    zones: report.byTime.map((z) => ({ zone: z.zone as 1 | 2 | 3 | 4 | 5, pct: Math.round(z.pct ?? 0) })),
  };
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
}

/** Efficacité aérobie mensuelle : médiane de (m/min) / bpm par sortie à pied avec FC. */
export function efficiencyTrend(activities: Activity[], today: string, months = EFFICIENCY_MONTHS): EfficiencyTrend {
  const todayMonth = monthKey(today);
  const [y, m] = todayMonth.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - months, 1)).toISOString().slice(0, 7);
  const buckets = new Map<string, number[]>();
  for (const a of activities) {
    if (a.type !== 'run' || !a.avgHr || a.avgHr <= 0 || a.date > today) continue;
    const distM = (a.distanceKm ?? 0) * 1000;
    if (distM < EFFICIENCY_MIN_RUN_KM * 1000) continue;
    const key = monthKey(a.date);
    if (key < first) continue;
    const timeSec = a.movingTimeSec ?? a.durationMin * 60;
    if (timeSec <= 0) continue;
    buckets.set(key, [...(buckets.get(key) ?? []), distM / (timeSec / 60) / a.avgHr]);
  }
  const points: EfficiencyPoint[] = [...buckets.entries()]
    .map(([month, efs]) => ({
      month,
      runs: efs.length,
      ef: Math.round(median(efs) * 1000) / 1000,
      reliable: efs.length >= EFFICIENCY_MIN_RUNS_PER_MONTH,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  const reliable = points.filter((p) => p.reliable);
  const counts = { reliableMonths: reliable.length, requiredMonths: EFFICIENCY_MIN_RELIABLE_MONTHS };
  if (reliable.length < EFFICIENCY_MIN_RELIABLE_MONTHS) return { status: 'insufficient', points, ...counts };
  const [prev, last] = reliable.slice(-2);
  const deltaPct = round1(((last.ef - prev.ef) / prev.ef) * 100);
  const direction = deltaPct >= EFFICIENCY_FLAT_PCT ? 'up' : deltaPct <= -EFFICIENCY_FLAT_PCT ? 'down' : 'flat';
  return { status: 'ok', points, direction, deltaPct, ...counts };
}

/** Une semaine vide récente n'est pas une pause : le bandeau n'apparaît qu'au-delà de 7 jours. */
export const STALE_AFTER_DAYS = 7;

/** Dernière activité passée si elle date de plus de 7 jours, sinon aujourd'hui. */
export function trendAnchor(activities: Activity[], today: string): { asOf: string; stale: boolean } {
  const past = activities.filter((a) => a.date <= today).map((a) => a.date);
  const latest = past.length ? past.reduce((m, d) => (d > m ? d : m)) : undefined;
  if (!latest || latest >= mondayOf(today) || daysBetween(latest, today) < STALE_AFTER_DAYS) {
    return { asOf: today, stale: false };
  }
  return { asOf: latest, stale: true };
}

export function buildSportTrends(input: {
  activities: Activity[];
  today: string;
  configuredMaxHr?: number;
  ageYears?: number;
}): SportTrends {
  const { activities } = input;
  const { asOf, stale } = trendAnchor(activities, input.today);
  const hrDates = activities
    .filter((a) => a.type === 'run' && a.avgHr !== undefined && a.avgHr > 0 && a.date <= input.today)
    .map((a) => a.date);
  const intensity = intensityTrend(activities, asOf, resolveMaxHr({ ...input, today: asOf }));
  return {
    lastHrDate: hrDates.length ? hrDates.reduce((m, d) => (d > m ? d : m)) : undefined,
    hrAbsent: !activities.some(
      (a) =>
        a.type === 'run' &&
        (a.distanceKm ?? 0) >= INTENSITY_MIN_RUN_KM &&
        a.avgHr !== undefined &&
        a.avgHr > 0 &&
        a.date >= intensity.from &&
        a.date <= asOf,
    ),
    asOf,
    stale,
    volume: volumeTrend(activities, asOf, VOLUME_WEEKS, !stale),
    intensity,
    efficiency: efficiencyTrend(activities, asOf),
  };
}
