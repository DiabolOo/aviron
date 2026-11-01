import type { Activity } from './schemas';
import { parseISODate } from './dates';

// Formats d'affichage par sport (français) — pur, sans React.
// Allure ou vitesse = temps en mouvement / distance quand il existe.

export function formatSecAsClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
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

/** « 9,1 » — virgule décimale française, une décimale. */
export function formatKmNumber(km: number): string {
  return km.toFixed(1).replace('.', ',');
}

/** « 9,1 km ». */
export function formatKm(km: number): string {
  return `${formatKmNumber(km)} km`;
}

/** « 798 km » — les totaux sont arrondis à l'unité. */
export function formatKmTotal(km: number): string {
  return `${Math.round(km)} km`;
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

export function displayActivityName(name: string): string {
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
