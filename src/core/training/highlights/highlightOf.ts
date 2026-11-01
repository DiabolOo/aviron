import { analyzeSplits, effortTimeSec } from '../../sportFormat';
import { addDays, daysBetween } from '../engine/periods';
import { highlightCopyFr, type HighlightKind } from '../insights/copy.fr';

/** Forme minimale commune à `Activity` (schéma) et `StravaActivity` (UI). */
export interface HighlightActivity {
  id: string;
  type: string;
  date: string;
  distanceKm?: number;
  durationMin: number;
  movingTimeSec?: number;
  movingTimeMin?: number;
  splits?: { km: number; paceSec: number }[];
}

export interface Highlight {
  kind: HighlightKind;
  /** la flamme orange est réservée aux candidats a et b ; les autres prennent l'accent du thème */
  tone: 'flame' | 'accent';
  title: string;
  value: string;
  detail: string;
}

/** Fenêtre de comparaison de la « sortie la plus rapide » : 12 mois. */
export const FASTEST_WINDOW_DAYS = 365;
/** Au moins 5 sorties comparables : en dessous, « la plus rapide » ne veut rien dire. */
export const FASTEST_MIN_COMPARABLE = 5;
/** Distance comparable : ±20 %. */
export const COMPARABLE_RATIO = 0.2;
/** Il faut battre le meilleur comparable d'au moins 1 % (≈ 3 s/km) : en dessous, c'est du bruit de mesure. */
export const FASTEST_MIN_MARGIN_PCT = 1;
/** « Plus longue sortie » : sur 12 semaines. */
export const LONGEST_WINDOW_DAYS = 84;
/** Au moins 3 sorties du même sport dans la fenêtre, sinon rien à dépasser. */
export const LONGEST_MIN_ACTIVITIES = 3;
/** Retour après au moins 14 jours sans aucune activité. */
export const RETURN_GAP_DAYS = 14;
/** Un km partiel de moins de 0,5 km n'est pas comparable. */
export const MIN_SPLIT_KM = 0.5;
/** Un km n'est « le plus rapide » que s'il se détache : au moins 5 % plus rapide que le km médian. */
export const FASTEST_KM_MIN_GAIN_PCT = 5;
/** Mini de kilomètres pour parler de km rapide, de seconde moitié ou de régularité. */
export const MIN_SPLITS = 3;
/** Seconde moitié plus rapide d'au moins 2 % pour parler de « negative split ». */
export const NEGATIVE_SPLIT_MIN_PCT = 2;
/** Régularité : coefficient de variation des allures par km < 3 %. */
export const STEADY_MAX_CV = 0.03;
export const STEADY_MIN_SPLITS = 4;

interface Seg {
  km: number;
  len: number;
  paceSec: number;
}

/** Splits d'au moins `minKm`, arrêts (> 3 × médiane) exclus. */
function movingSegments(splits: { km: number; paceSec: number }[] | undefined, minKm: number): Seg[] {
  if (!splits?.length) return [];
  const stops = analyzeSplits(splits).stops;
  let prev = 0;
  const segs: Seg[] = [];
  for (const s of splits) {
    const len = s.km - prev;
    prev = s.km;
    if (len >= minKm && s.paceSec > 0 && !stops.has(s.km)) segs.push({ km: s.km, len, paceSec: s.paceSec });
  }
  return segs;
}

/** Splits complets (≈ 1 km) pour la courbe d'allure. */
export const fullSegments = (splits: { km: number; paceSec: number }[] | undefined): Seg[] =>
  movingSegments(splits, 0.99);

const pacePerKm = (a: HighlightActivity): number | undefined =>
  a.distanceKm && a.distanceKm > 0 ? effortTimeSec(a) / a.distanceKm : undefined;

function fastestComparable(a: HighlightActivity, history: HighlightActivity[], beginner: boolean): Highlight | null {
  const pace = pacePerKm(a);
  if (pace === undefined || !a.distanceKm) return null;
  const start = addDays(a.date, -FASTEST_WINDOW_DAYS);
  if (!history.some((h) => h.date <= start)) return null; // l'historique ne couvre pas la fenêtre
  const comparable = history.filter(
    (h) =>
      h.type === a.type &&
      h.date >= start &&
      h.date <= a.date &&
      h.distanceKm !== undefined &&
      Math.abs(h.distanceKm - a.distanceKm!) / a.distanceKm! <= COMPARABLE_RATIO,
  );
  const paces = comparable.map(pacePerKm).filter((p): p is number => p !== undefined);
  if (paces.length < FASTEST_MIN_COMPARABLE) return null;
  if (paces.some((p) => p * (1 - FASTEST_MIN_MARGIN_PCT / 100) <= pace)) return null;
  const text = highlightCopyFr('fastest_comparable', {
    beginner,
    paceSec: Math.round(pace),
    comparable: paces.length,
    windowDays: FASTEST_WINDOW_DAYS,
  });
  return { kind: 'fastest_comparable', tone: 'flame', ...text };
}

function longest(a: HighlightActivity, history: HighlightActivity[], beginner: boolean): Highlight | null {
  if (!a.distanceKm) return null;
  const start = addDays(a.date, -LONGEST_WINDOW_DAYS);
  if (!history.some((h) => h.date <= start)) return null;
  const same = history.filter((h) => h.type === a.type && h.date >= start && h.date <= a.date && h.distanceKm);
  if (same.length < LONGEST_MIN_ACTIVITIES || same.some((h) => (h.distanceKm as number) >= a.distanceKm!)) return null;
  const text = highlightCopyFr('longest', { beginner, distanceKm: a.distanceKm, windowDays: LONGEST_WINDOW_DAYS });
  return { kind: 'longest', tone: 'flame', ...text };
}

function comeback(a: HighlightActivity, history: HighlightActivity[], beginner: boolean): Highlight | null {
  const before = history.filter((h) => h.date < a.date).map((h) => h.date).sort();
  const last = before[before.length - 1];
  if (last === undefined) return null;
  const gap = daysBetween(last, a.date);
  if (gap < RETURN_GAP_DAYS) return null;
  return { kind: 'return', tone: 'accent', ...highlightCopyFr('return', { beginner, gapDays: gap }) };
}

function fastestKm(a: HighlightActivity, beginner: boolean): Highlight | null {
  const segs = movingSegments(a.splits, MIN_SPLIT_KM);
  if (segs.length < MIN_SPLITS) return null;
  const best = segs.reduce((m, s) => (s.paceSec < m.paceSec ? s : m));
  const sorted = segs.map((s) => s.paceSec).sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)];
  if ((median - best.paceSec) / median < FASTEST_KM_MIN_GAIN_PCT / 100) return null;
  const lateInRun = segs.slice(-2).includes(best);
  const text = highlightCopyFr('fastest_km', { beginner, paceSec: best.paceSec, km: Math.round(best.km), lateInRun });
  return { kind: 'fastest_km', tone: 'accent', ...text };
}

function negativeSplit(a: HighlightActivity, beginner: boolean): Highlight | null {
  const segs = movingSegments(a.splits, MIN_SPLIT_KM);
  if (segs.length < STEADY_MIN_SPLITS) return null;
  const total = segs.reduce((s, x) => s + x.len, 0);
  let acc = 0;
  let firstTime = 0;
  let firstLen = 0;
  let secondTime = 0;
  let secondLen = 0;
  for (const s of segs) {
    const mid = acc + s.len / 2;
    acc += s.len;
    if (mid <= total / 2) {
      firstTime += s.paceSec * s.len;
      firstLen += s.len;
    } else {
      secondTime += s.paceSec * s.len;
      secondLen += s.len;
    }
  }
  if (!firstLen || !secondLen) return null;
  const first = firstTime / firstLen;
  const second = secondTime / secondLen;
  if ((first - second) / first < NEGATIVE_SPLIT_MIN_PCT / 100) return null;
  const gain = Math.round(first - second);
  return { kind: 'negative_split', tone: 'accent', ...highlightCopyFr('negative_split', { beginner, gainSecPerKm: gain }) };
}

function steady(a: HighlightActivity, beginner: boolean): Highlight | null {
  const segs = movingSegments(a.splits, 0.99);
  if (segs.length < STEADY_MIN_SPLITS) return null;
  const paces = segs.map((s) => s.paceSec);
  const mean = paces.reduce((s, p) => s + p, 0) / paces.length;
  const sd = Math.sqrt(paces.reduce((s, p) => s + (p - mean) ** 2, 0) / paces.length);
  if (mean <= 0 || sd / mean >= STEADY_MAX_CV) return null;
  return { kind: 'steady', tone: 'accent', ...highlightCopyFr('steady', { beginner, spreadSecPerKm: Math.round(sd) }) };
}

/**
 * Moment fort d'une activité : un seul, le premier candidat valable dans l'ordre
 * a (plus rapide) > b (plus longue) > c (retour) > d (km rapide) > e (seconde moitié) > f (régularité).
 * `history` = les autres activités ; null sans données suffisantes (jamais de chiffre approximatif).
 */
export function highlightOf(
  activity: HighlightActivity,
  history: HighlightActivity[],
  opts: { beginner?: boolean } = {},
): Highlight | null {
  const beginner = opts.beginner ?? false;
  const others = history.filter((h) => h.id !== activity.id);
  return (
    fastestComparable(activity, others, beginner) ??
    longest(activity, others, beginner) ??
    comeback(activity, others, beginner) ??
    fastestKm(activity, beginner) ??
    negativeSplit(activity, beginner) ??
    steady(activity, beginner) ??
    null
  );
}
