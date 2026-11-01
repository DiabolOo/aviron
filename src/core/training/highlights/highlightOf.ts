import { analyzeSplits, effortTimeSec } from '../../sportFormat';
import { addDays, daysBetween } from '../engine/periods';
import { highlightCopyFr, type HighlightKind } from '../insights/copy.fr';

/** Forme minimale commune à `Activity` (schéma) et `StravaActivity` (UI). */
export interface HighlightActivity {
  id: string;
  type: string;
  date: string;
  distanceKm?: number;
  elevationM?: number;
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
  /** km mis en avant sur la courbe d'allure (km le plus rapide) */
  km?: number;
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
/** « Plus longue », « plus gros dénivelé » : au moins 1 % d'avance sur la meilleure sortie de la fenêtre. */
export const BEAT_MIN_MARGIN_PCT = 1;
/** Dénivelé minimal pour parler de « plus gros dénivelé » : en dessous, ce n'est que du plat. */
export const MIN_CLIMB_M = 50;
/** Régularité de la muscu : au moins une séance dans chacune des 4 dernières semaines. */
export const STEADY_MONTH_WEEKS = 4;
/** Retour après au moins 14 jours sans aucune activité. */
export const RETURN_GAP_DAYS = 14;
/** « Km le plus rapide » : un split partiel de moins de 0,5 km n'est pas un kilomètre. */
export const MIN_SPLIT_KM = 0.5;
/** Courbe et moitiés : tout split partiel compte, sous 50 m ce n'est que du bruit GPS. */
export const MIN_CURVE_KM = 0.05;
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

/** Splits de la courbe d'allure : arrêts exclus, dernier split partiel inclus (sauf bruit GPS sous 50 m). */
export const curveSegments = (splits: { km: number; paceSec: number }[] | undefined): Seg[] =>
  movingSegments(splits, MIN_CURVE_KM);

const pacePerKm = (a: HighlightActivity): number | undefined =>
  a.distanceKm && a.distanceKm > 0 ? effortTimeSec(a) / a.distanceKm : undefined;

/**
 * Index des comparables : calculé une fois par version de l'historique (snapshot),
 * partagé par toutes les activités au lieu d'un balayage complet par moment fort.
 */
export interface ComparablesIndex {
  /** toutes les activités, dates croissantes */
  sorted: HighlightActivity[];
  /** même tri, regroupé par type de sport */
  byType: ReadonlyMap<string, HighlightActivity[]>;
  /** allure s/km précalculée par id d'activité */
  paceById: ReadonlyMap<string, number | undefined>;
}

export function comparablesIndex(history: readonly HighlightActivity[]): ComparablesIndex {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const byType = new Map<string, HighlightActivity[]>();
  for (const a of sorted) {
    const bucket = byType.get(a.type);
    if (bucket) bucket.push(a);
    else byType.set(a.type, [a]);
  }
  const paceById = new Map(history.map((a) => [a.id, pacePerKm(a)]));
  return { sorted, byType, paceById };
}

const paceOf = (a: HighlightActivity, index: ComparablesIndex): number | undefined =>
  index.paceById.get(a.id) ?? pacePerKm(a);

/** l'historique couvre-t-il `start` (au moins une activité plus ancienne) ? */
const coversWindow = (index: ComparablesIndex, start: string): boolean =>
  index.sorted.length > 0 && index.sorted[0].date <= start;

/** Activités du même sport dans [start, a.date], l'activité elle-même exclue. */
function sameTypeInWindow(a: HighlightActivity, index: ComparablesIndex, start: string): HighlightActivity[] {
  const out: HighlightActivity[] = [];
  for (const h of index.byType.get(a.type) ?? []) {
    if (h.date < start) continue;
    if (h.date > a.date) break; // tri croissant
    if (h.id !== a.id) out.push(h);
  }
  return out;
}

/** Dernière date strictement avant a.date (recherche dichotomique sur le tri). */
function lastDateBefore(index: ComparablesIndex, date: string): string | undefined {
  let lo = 0;
  let hi = index.sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (index.sorted[mid].date < date) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 ? index.sorted[lo - 1].date : undefined;
}

type FastestKind = 'fastest_comparable' | 'fastest_speed' | 'fastest_swim';

function fastestComparable(
  a: HighlightActivity,
  index: ComparablesIndex,
  beginner: boolean,
  kind: FastestKind = 'fastest_comparable',
): Highlight | null {
  const pace = paceOf(a, index);
  if (pace === undefined || !a.distanceKm) return null;
  const start = addDays(a.date, -FASTEST_WINDOW_DAYS);
  if (!coversWindow(index, start)) return null; // l'historique ne couvre pas la fenêtre
  const comparable = sameTypeInWindow(a, index, start).filter(
    (h) => h.distanceKm !== undefined && Math.abs(h.distanceKm - a.distanceKm!) / a.distanceKm! <= COMPARABLE_RATIO,
  );
  const paces = comparable.map((h) => paceOf(h, index)).filter((p): p is number => p !== undefined);
  if (paces.length < FASTEST_MIN_COMPARABLE) return null;
  if (paces.some((p) => p * (1 - FASTEST_MIN_MARGIN_PCT / 100) <= pace)) return null;
  const text = highlightCopyFr(kind, {
    beginner,
    paceSec: Math.round(pace),
    comparable: paces.length,
    windowDays: FASTEST_WINDOW_DAYS,
  });
  return { kind, tone: 'flame', ...text };
}

/** Plus grande valeur de la fenêtre de 12 semaines, avec au moins 1 % d'avance ; au moins 3 séances du même sport. */
function beatsWindow(
  a: HighlightActivity,
  index: ComparablesIndex,
  valueOf: (x: HighlightActivity) => number | undefined,
): boolean {
  const mine = valueOf(a);
  if (!mine) return false;
  const start = addDays(a.date, -LONGEST_WINDOW_DAYS);
  if (!coversWindow(index, start)) return false;
  const others = sameTypeInWindow(a, index, start)
    .map(valueOf)
    .filter((v): v is number => !!v);
  return others.length >= LONGEST_MIN_ACTIVITIES && others.every((v) => v * (1 + BEAT_MIN_MARGIN_PCT / 100) < mine);
}

const NOUN: Record<string, 'sortie' | 'séance'> = { swim: 'séance', strength: 'séance' };

function longest(a: HighlightActivity, index: ComparablesIndex, beginner: boolean): Highlight | null {
  if (!a.distanceKm || !beatsWindow(a, index, (x) => x.distanceKm)) return null;
  const text = highlightCopyFr('longest', {
    beginner,
    distanceKm: a.distanceKm,
    windowDays: LONGEST_WINDOW_DAYS,
    noun: NOUN[a.type] ?? 'sortie',
  });
  return { kind: 'longest', tone: 'flame', ...text };
}

function biggestClimb(a: HighlightActivity, index: ComparablesIndex, beginner: boolean): Highlight | null {
  if ((a.elevationM ?? 0) < MIN_CLIMB_M || !beatsWindow(a, index, (x) => x.elevationM)) return null;
  const text = highlightCopyFr('biggest_climb', { beginner, elevationM: a.elevationM, windowDays: LONGEST_WINDOW_DAYS });
  return { kind: 'biggest_climb', tone: 'accent', ...text };
}

function longestSession(a: HighlightActivity, index: ComparablesIndex, beginner: boolean): Highlight | null {
  if (!beatsWindow(a, index, (x) => x.durationMin)) return null;
  const text = highlightCopyFr('longest_session', { beginner, durationMin: a.durationMin, windowDays: LONGEST_WINDOW_DAYS });
  return { kind: 'longest_session', tone: 'flame', ...text };
}

/** Retour : au moins 14 jours depuis la dernière activité (`sameSport` : depuis la dernière du même sport). */
function comeback(a: HighlightActivity, index: ComparablesIndex, beginner: boolean, sameSport = false): Highlight | null {
  let last: string | undefined;
  if (sameSport) {
    const bucket = index.byType.get(a.type) ?? [];
    for (let i = bucket.length - 1; i >= 0; i--) {
      if (bucket[i].date < a.date) {
        last = bucket[i].date;
        break;
      }
    }
  } else {
    last = lastDateBefore(index, a.date);
  }
  if (last === undefined) return null;
  const gap = daysBetween(last, a.date);
  if (gap < RETURN_GAP_DAYS) return null;
  const noun = sameSport ? (NOUN[a.type] ?? 'sortie') : 'sortie';
  return { kind: 'return', tone: 'accent', ...highlightCopyFr('return', { beginner, gapDays: gap, noun }) };
}

/** Régularité du mois : au moins une séance dans chacune des 4 dernières semaines glissantes, séance du jour comprise. */
function steadyMonth(a: HighlightActivity, index: ComparablesIndex, beginner: boolean): Highlight | null {
  const start = addDays(a.date, -(STEADY_MONTH_WEEKS * 7 - 1));
  if (!coversWindow(index, addDays(start, -1))) return null;
  const dates = [a.date, ...sameTypeInWindow(a, index, start).map((h) => h.date)];
  for (let w = 0; w < STEADY_MONTH_WEEKS; w++) {
    const to = addDays(a.date, -7 * w);
    const from = addDays(to, -6);
    if (!dates.some((d) => d >= from && d <= to)) return null;
  }
  return { kind: 'steady_month', tone: 'accent', ...highlightCopyFr('steady_month', { beginner, weeks: STEADY_MONTH_WEEKS }) };
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
  return { kind: 'fastest_km', tone: 'accent', km: Math.round(best.km), ...text };
}

function negativeSplit(a: HighlightActivity, beginner: boolean): Highlight | null {
  const segs = movingSegments(a.splits, MIN_CURVE_KM);
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
 * Moment fort d'une activité sur un index précalculé : les candidats qui comparent à
 * l'historique (a, b, c) lisent l'index ; l'activité elle-même y est exclue par id.
 */
export function highlightOfIndexed(
  activity: HighlightActivity,
  index: ComparablesIndex,
  opts: { beginner?: boolean } = {},
): Highlight | null {
  const beginner = opts.beginner ?? false;
  switch (activity.type) {
    case 'run':
      return (
        fastestComparable(activity, index, beginner) ??
        longest(activity, index, beginner) ??
        comeback(activity, index, beginner) ??
        fastestKm(activity, beginner) ??
        negativeSplit(activity, beginner) ??
        steady(activity, beginner) ??
        null
      );
    case 'ride':
      return (
        longest(activity, index, beginner) ??
        fastestComparable(activity, index, beginner, 'fastest_speed') ??
        biggestClimb(activity, index, beginner)
      );
    case 'swim':
      return longest(activity, index, beginner) ?? fastestComparable(activity, index, beginner, 'fastest_swim');
    case 'walk':
      return longest(activity, index, beginner) ?? biggestClimb(activity, index, beginner);
    case 'strength':
      return (
        comeback(activity, index, beginner, true) ??
        longestSession(activity, index, beginner) ??
        steadyMonth(activity, index, beginner)
      );
    default:
      return null;
  }
}

/** Médiane des 8 dernières semaines du même sport (séances précédentes seulement). */
export const MEDIAN_WINDOW_WEEKS = 8;
/** Moins de 3 séances : une médiane ne veut rien dire. */
export const MEDIAN_MIN_ACTIVITIES = 3;

export interface MedianComparison {
  /** valeur de la séance et médiane, dans la même unité (km, ou minutes pour la muscu) */
  value: number;
  median: number;
  /** écart relatif en % (positif = au-dessus de la médiane) */
  deltaPct: number;
  unit: 'km' | 'min';
  count: number;
}

/**
 * Compare la séance à la médiane des 8 dernières semaines du même sport : distance pour les sports
 * à distance, durée pour la musculation. Null sans assez de séances ou de valeur.
 */
export function medianComparison(a: HighlightActivity, index: ComparablesIndex): MedianComparison | null {
  const unit = a.type === 'strength' ? 'min' : a.type === 'other' ? undefined : 'km';
  if (!unit) return null;
  const valueOf = (x: HighlightActivity) => (unit === 'km' ? x.distanceKm : x.durationMin);
  const value = valueOf(a);
  if (!value || value <= 0) return null;
  const start = addDays(a.date, -MEDIAN_WINDOW_WEEKS * 7);
  if (!coversWindow(index, start)) return null;
  const others = sameTypeInWindow(a, index, start)
    .filter((h) => h.date < a.date)
    .map(valueOf)
    .filter((v): v is number => !!v && v > 0)
    .sort((x, y) => x - y);
  if (others.length < MEDIAN_MIN_ACTIVITIES) return null;
  const mid = Math.floor(others.length / 2);
  const median = others.length % 2 ? others[mid] : (others[mid - 1] + others[mid]) / 2;
  return { value, median, deltaPct: Math.round(((value - median) / median) * 100), unit, count: others.length };
}

/**
 * Moment fort d'une activité : un seul, le premier candidat valable dans l'ordre
 * a (plus rapide) > b (plus longue) > c (retour) > d (km rapide) > e (seconde moitié) > f (régularité).
 * `history` = toutes les activités ; null sans données suffisantes (jamais de chiffre approximatif).
 */
export function highlightOf(
  activity: HighlightActivity,
  history: readonly HighlightActivity[],
  opts: { beginner?: boolean } = {},
): Highlight | null {
  return highlightOfIndexed(activity, comparablesIndex(history), opts);
}
