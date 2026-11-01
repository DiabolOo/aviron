import type { Activity } from './schemas';
import { parseISODate } from './dates';

// Formats d'affichage par sport (français) — pur, sans React.
// Allure ou vitesse = temps en mouvement / distance quand il existe.

export function formatSecAsClock(sec: number): string {
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}

export interface EffortPace {
  label: 'Allure' | 'Vitesse';
  /** « 5:26 » ou « 23,4 » */
  value: string;
  /** « /km » · « /100 m » · « km/h » */
  unit: string;
}

/**
 * Allure/vitesse affichée selon le sport :
 * run, walk → min/km · ride → km/h · swim → min/100 m ·
 * strength, other → aucune allure (undefined).
 */
export function activityPace(
  type: Activity['type'],
  distanceKm: number | undefined,
  timeSec: number | undefined,
): EffortPace | undefined {
  if (distanceKm === undefined || distanceKm <= 0 || timeSec === undefined || timeSec <= 0) {
    return undefined;
  }
  if (type === 'run' || type === 'walk') {
    return { label: 'Allure', value: formatSecAsClock(timeSec / distanceKm), unit: '/km' };
  }
  if (type === 'ride') {
    return { label: 'Vitesse', value: ((distanceKm * 3600) / timeSec).toFixed(1).replace('.', ','), unit: 'km/h' };
  }
  if (type === 'swim') {
    return { label: 'Allure', value: formatSecAsClock(timeSec / (distanceKm * 10)), unit: '/100 m' };
  }
  return undefined;
}

/** Temps de référence de l'allure/vitesse : temps de déplacement (en secondes) quand il existe, sinon temps écoulé. */
export function effortTimeSec(a: {
  movingTimeSec?: number;
  movingTimeMin?: number;
  durationMin: number;
}): number {
  if (a.movingTimeSec !== undefined && a.movingTimeSec > 0) return a.movingTimeSec;
  return (a.movingTimeMin ?? a.durationMin) * 60;
}

/** « 45:18 » ou « 1:02:05 » : h:mm:ss, ou mm:ss sous l'heure. */
export function formatClock(totalSec: number): string {
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = `${sec % 60}`.padStart(2, '0');
  return h > 0 ? `${h}:${`${m}`.padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Espace insécable : « 49:13 au total » ne se coupe jamais. */
export const NBSP = '\u00a0';
/** Trait d'union insécable : « après‑midi » ne se coupe jamais en fin de ligne. */
export const NB_HYPHEN = '\u2011';

const UNIT_AFTER_SPACE = /(\d) (\/km|%|min|km|bpm)(?![\p{L}\d])/gu;

/** Espace insécable entre un nombre et « /km », « % », « min », « km », « bpm » : l'unité ne passe jamais seule à la ligne. */
export function nbspUnits(text: string): string {
  return text.replace(UNIT_AFTER_SPACE, `$1${NBSP}$2`);
}

export interface DurationDisplay {
  main: string;
  /** « 49:13 au total » — seulement si le temps écoulé dépasse d'au moins 1 min le temps de déplacement */
  total?: string;
}

/**
 * Durée affichée : temps de déplacement en principal, temps écoulé en second s'il en diffère d'au moins 1 min.
 * Les courses (`race`) gardent le temps écoulé : c'est le chrono officiel.
 */
export function activityDurationDisplay(
  a: { movingTimeSec?: number; movingTimeMin?: number; durationMin: number },
  race = false,
): DurationDisplay {
  const elapsed = Math.round(a.durationMin * 60);
  const main = activityDurationSec(a, race);
  return {
    main: formatClock(main),
    total: elapsed - main >= 60 ? `${formatClock(elapsed)}${NBSP}au${NBSP}total` : undefined,
  };
}

/** Durée principale en secondes, même règle que `activityDurationDisplay` (sert aux totaux). */
export function activityDurationSec(
  a: { movingTimeSec?: number; movingTimeMin?: number; durationMin: number },
  race = false,
): number {
  const hasMoving = (a.movingTimeSec ?? 0) > 0 || (a.movingTimeMin ?? 0) > 0;
  return race || !hasMoving ? Math.round(a.durationMin * 60) : Math.round(effortTimeSec(a));
}

/** Un split plus de 3 fois plus lent que la médiane est un arrêt (feu, pause, café…). */
export const STOP_FACTOR = 3;

export interface SplitScale {
  median: number;
  /** km des splits considérés comme arrêts */
  stops: Set<number>;
  /** extrêmes des splits en mouvement (hors arrêts), undefined s'il n'y en a aucun */
  fastest?: number;
  slowest?: number;
}

export function analyzeSplits(splits: { km: number; paceSec: number }[]): SplitScale {
  const sorted = splits.map((s) => s.paceSec).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length === 0 ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const stops = new Set(splits.filter((s) => median > 0 && s.paceSec > STOP_FACTOR * median).map((s) => s.km));
  const moving = splits.filter((s) => !stops.has(s.km)).map((s) => s.paceSec);
  return {
    median,
    stops,
    fastest: moving.length ? Math.min(...moving) : undefined,
    slowest: moving.length ? Math.max(...moving) : undefined,
  };
}

export interface ActivityLayout {
  /** distance en grand titre (sinon la durée) */
  showDistance: boolean;
  showElevation: boolean;
  showSplits: boolean;
}

/** Ce que le détail d'une activité affiche selon le sport (allure : voir activityPace). */
export function activityLayout(type: Activity['type']): ActivityLayout {
  switch (type) {
    case 'run':
    case 'walk':
      return { showDistance: true, showElevation: true, showSplits: true };
    case 'ride':
      return { showDistance: true, showElevation: true, showSplits: false };
    case 'swim':
      return { showDistance: true, showElevation: false, showSplits: false };
    default:
      return { showDistance: false, showElevation: false, showSplits: false };
  }
}

/** « 9,1 » — virgule décimale française, une décimale. */
export function formatKmNumber(km: number): string {
  return km.toFixed(1).replace('.', ',');
}

/** Km d'un split : « 01 » pour un km entier, « 9,1 » pour le dernier split partiel. */
export function formatSplitKm(km: number): string {
  return Number.isInteger(km) ? `${km}`.padStart(2, '0') : formatKmNumber(km);
}

/** « 9,1 km ». */
export function formatKm(km: number): string {
  return `${formatKmNumber(km)} km`;
}

/** « 798 km » — les totaux sont arrondis à l'unité. */
export function formatKmTotal(km: number): string {
  return `${Math.round(km)} km`;
}

/** Distance d'un total par sport : « 1,5 km » sous 10 km (nage), « 128 km » au-delà. */
export function formatSportKm(km: number): string {
  return km < 10 ? formatKm(km) : formatKmTotal(km);
}

/** « vendredi 8 mars » — jour en minuscules, sans l'année. */
export function formatDayLong(iso: string): string {
  return parseISODate(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** « 12:01 » — heure sans secondes (accepte « HH:mm[:ss] »). */
export function formatHour(startTime: string): string {
  return startTime.slice(0, 5);
}

// ─── Titres automatiques Strava ────────────────────────────────────────────────
// L'export conserve les titres auto anglais (« Lunch run », « Morning Swim ») ;
// on les affiche en français sans modifier la donnée. Correspondance exacte
// uniquement : un titre saisi par l'utilisateur n'est jamais retouché.

const TIME_OF_DAY: Record<string, string> = {
  morning: 'du matin',
  lunch: 'du midi',
  afternoon: "de l'après-midi",
  evening: 'du soir',
  night: 'du soir',
};

const AUTO_SPORTS: Record<string, string> = {
  run: 'Course',
  walk: 'Marche',
  ride: 'Sortie vélo',
  swim: 'Nage',
  hike: 'Randonnée',
  'weight training': 'Musculation',
};

/** Titre affiché : titres automatiques traduits, traits d'union rendus insécables. */
export function displayActivityName(name: string): string {
  return translateAutoName(name).replace(/-/g, NB_HYPHEN);
}

function translateAutoName(name: string): string {
  const trimmed = name.trim();
  const firstSpace = trimmed.indexOf(' ');
  const first = firstSpace > 0 ? trimmed.slice(0, firstSpace).toLowerCase() : '';
  const rest = firstSpace > 0 ? trimmed.slice(firstSpace + 1).toLowerCase() : '';
  const sport = AUTO_SPORTS[rest] ?? AUTO_SPORTS[trimmed.toLowerCase()];
  if (!sport) return trimmed;
  const time = AUTO_SPORTS[rest] ? TIME_OF_DAY[first] : undefined;
  if (AUTO_SPORTS[rest] && !time) return trimmed; // préfixe non reconnu : titre laissé tel quel
  return time ? `${sport} ${time}` : sport;
}
