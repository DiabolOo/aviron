/**
 * Niveau déclaré (SPEC-v3 « Niveau déclaré », planche `001` §04) — pur, sans React.
 *
 * Le niveau fixe les mots et la densité de chiffres ; les données ne font que retirer
 * ce qu'on ne peut pas savoir (pas de cardio → pas de bpm), elles ne changent jamais le niveau.
 */

import { formatDuration } from '../format';
import { formatKmNumber, formatSecAsClock, nbspUnits, NBSP } from '../sportFormat';
import type { DeclaredLevel, Equipment, UserProfile } from '../types';
import { hrZones } from './engine/zones';
import type { AthleteProfile } from './types';

export type { DeclaredLevel, Equipment };

/** Intensité prévue d'une séance : « Facile · Soutenu · Intense ». */
export type PlannedIntensity = 'easy' | 'moderate' | 'hard';

// ─── Onboarding (`210`, étapes 1 et 2) ───────────────────────────────────────

export const LEVEL_OPTIONS: readonly { id: DeclaredLevel; label: string; description: string }[] = [
  { id: 'beginner', label: 'Je débute', description: 'Je ne cours pas encore, ou très peu.' },
  { id: 'regular', label: 'Je cours un peu', description: 'Une ou deux sorties par semaine, sans plan.' },
  { id: 'advanced', label: 'Je m’entraîne', description: 'Un plan, des séances variées, un objectif chiffré.' },
];

export const EQUIPMENT_OPTIONS: readonly { id: Equipment; label: string; description: string }[] = [
  {
    id: 'hrWatch',
    label: 'Une montre avec cardio',
    description: 'Ou une ceinture\u00a0: je lis ta fréquence cardiaque.',
  },
  { id: 'phone', label: 'Mon téléphone', description: 'Je lis tes allures et tes distances.' },
  { id: 'none', label: 'Rien pour l’instant', description: 'Tu me dis quand la séance est faite, ça suffit.' },
];

/** Seule une montre (ou une ceinture) lit la FC ; sans réponse, on ne présume rien. */
export function hasHrDeviceFor(equipment: Equipment | undefined): boolean | undefined {
  return equipment === undefined ? undefined : equipment === 'hrWatch';
}

/** Profil d'athlète du moteur à partir du profil enregistré (niveau et équipement de l'onboarding). */
export function athleteProfileFrom(profile: UserProfile): AthleteProfile {
  return {
    ageYears: profile.ageYears,
    sex: profile.sex,
    weightKg: profile.weightKg,
    mainSport: profile.mainSport,
    maxHr: profile.maxHr,
    maxHrSource: profile.maxHr !== undefined ? 'configured' : undefined,
    hasHrDevice: hasHrDeviceFor(profile.equipment),
    athleticGoal: profile.athleticGoal,
    level: profile.level ?? 'beginner',
  };
}

// ─── Repères d'intensité ─────────────────────────────────────────────────────

/** Ce que le niveau et les données permettent de dire. `maxHr` absent = aucune consigne en bpm. */
export type LevelGuidance = { level: DeclaredLevel; maxHr?: number };

/**
 * Les bpm ne sont donnés qu'à « Je m'entraîne », avec un cardio déclaré (ou pas de réponse),
 * une FC max connue et une FC qui arrive encore (`recentHrMissing` : voir `recentRunsLackHr`).
 */
export function levelGuidance(
  profile: Pick<AthleteProfile, 'level' | 'hasHrDevice' | 'maxHr'>,
  data: { recentHrMissing?: boolean } = {},
): LevelGuidance {
  const bpm = profile.level === 'advanced' && profile.hasHrDevice !== false && !data.recentHrMissing;
  return { level: profile.level, maxHr: bpm ? profile.maxHr : undefined };
}

/** Fourchette d'allure prévue, en secondes par km. */
export type PaceRange = { fastSecPerKm: number; slowSecPerKm: number };

const SENSATION: Record<PlannedIntensity, string> = {
  easy: 'tu dois pouvoir parler',
  moderate: 'tu parles par bribes',
  hard: 'tu ne peux plus parler',
};

const SENSATION_PACE: Record<PlannedIntensity, string> = {
  easy: 'à une allure où tu peux parler',
  moderate: 'à une allure où tu parles par bribes',
  hard: 'à une allure où tu ne peux plus parler',
};

const REFERENCE_PACE: Record<PlannedIntensity, string> = {
  easy: 'allure footing',
  moderate: 'allure semi',
  hard: 'allure 5\u00a0km',
};

const ZONES: Record<PlannedIntensity, string> = {
  easy: 'Z1–Z2',
  moderate: 'Z3',
  hard: 'Z4–Z5',
};

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Bornes de bpm : Facile sous le bas de Z3, Intense au-dessus du bas de Z4. */
export function intensityBpm(maxHr: number): { easyBelow: number; hardAbove: number } {
  const zones = hrZones(maxHr);
  return { easyBelow: zones[2].minBpm, hardAbove: zones[3].minBpm };
}

function bpmRange(intensity: PlannedIntensity, maxHr: number): string {
  const { easyBelow, hardAbove } = intensityBpm(maxHr);
  if (intensity === 'easy') return `sous ${easyBelow} bpm`;
  if (intensity === 'moderate') return `${easyBelow} à ${hardAbove} bpm`;
  return `au-dessus de ${hardAbove} bpm`;
}

/** « 5:30 à 5:45 /km ». */
export function formatPaceRange(pace: PaceRange): string {
  return nbspUnits(`${formatSecAsClock(pace.fastSecPerKm)} à ${formatSecAsClock(pace.slowSecPerKm)} /km`);
}

/**
 * Repère court d'une intensité (tableau de la planche `001`) :
 * « Tu dois pouvoir parler » · « Allure footing » · « Z1–Z2 · sous 150 bpm ».
 * Sans bpm, « Je m'entraîne » garde sa densité : « 5:30 à 5:45 /km, tu dois pouvoir parler ».
 */
export function intensityCue(intensity: PlannedIntensity, guidance: LevelGuidance, pace?: PaceRange): string {
  if (guidance.level === 'beginner') return capitalize(SENSATION[intensity]);
  if (guidance.level === 'regular') return capitalize(REFERENCE_PACE[intensity]);
  if (guidance.maxHr !== undefined) {
    return nbspUnits(`${ZONES[intensity]}${NBSP}·${NBSP}${bpmRange(intensity, guidance.maxHr)}`);
  }
  if (pace) return `${formatPaceRange(pace)}, ${SENSATION[intensity]}`;
  return capitalize(SENSATION[intensity]);
}

/** « 45 minutes », « 1h10 ». */
function durationWords(durationMin: number): string {
  const min = Math.round(durationMin);
  return min < 60 ? `${min}${NBSP}minutes` : formatDuration(min);
}

/**
 * Consigne de la séance du jour (`SessionCard.instruction`), déjà adaptée au niveau et aux données :
 * - « Je débute » : « 20 minutes, à une allure où tu peux parler. »
 * - « Je cours un peu » : « Environ 45 minutes, allure footing. »
 * - « Je m'entraîne » avec cardio : « Environ 45 minutes en Z1–Z2, sous 150 bpm. »
 * - « Je m'entraîne » sans cardio : « Environ 45 minutes, à une allure où tu peux parler : 5:30 à 5:45 /km. » (`102`)
 */
export function sessionInstruction(
  session: { intensity: PlannedIntensity; durationMin: number; pace?: PaceRange },
  guidance: LevelGuidance,
): string {
  const { intensity, pace } = session;
  const duration = durationWords(session.durationMin);
  if (guidance.level === 'beginner') return `${capitalize(duration)}, ${SENSATION_PACE[intensity]}.`;
  if (guidance.level === 'regular') return `Environ ${duration}, ${REFERENCE_PACE[intensity]}.`;
  if (guidance.maxHr !== undefined) {
    return nbspUnits(`Environ ${duration} en ${ZONES[intensity]}, ${bpmRange(intensity, guidance.maxHr)}.`);
  }
  const paceText = pace ? `${NBSP}: ${formatPaceRange(pace)}` : '';
  return `Environ ${duration}, ${SENSATION_PACE[intensity]}${paceText}.`;
}

// ─── Héros d'Aujourd'hui ─────────────────────────────────────────────────────

function kmWords(km: number): string {
  return `${Number.isInteger(km) ? `${km}` : formatKmNumber(km)}${NBSP}km`;
}

/**
 * Mesure qui fait le héros de la séance du jour : en minutes pour « Je débute », en km sinon.
 * Sans distance prévue, on descend aux minutes (jamais une donnée absente).
 */
export function todaySessionMeasure(level: DeclaredLevel, session: { durationMin: number; distanceKm?: number }): string {
  if (level !== 'beginner' && session.distanceKm !== undefined && session.distanceKm > 0) {
    return kmWords(session.distanceKm);
  }
  return durationWords(session.durationMin);
}

/** Place de la séance dans la semaine, pour « Je m'entraîne » seulement : « 2e séance sur 4 cette semaine ». */
export function weekPlace(level: DeclaredLevel, rank: number, count: number): string | undefined {
  if (level !== 'advanced' || count < 1 || rank < 1 || rank > count) return undefined;
  return `${rank === 1 ? '1re' : `${rank}e`} séance sur ${count} cette semaine`;
}

/** Libellés de la carte de la séance du jour (`102`, `105`) : le débutant valide « quand c'est fait ». */
export type SessionCardLabels = { holdHint: string; postponeLabel: string };

export function sessionCardLabels(level: DeclaredLevel): SessionCardLabels {
  return level === 'beginner'
    ? { holdHint: 'Maintiens la carte quand c’est fait', postponeLabel: 'Plus tard' }
    : { holdHint: 'Maintiens la carte pour valider', postponeLabel: 'Reporter' };
}

// ─── Densité du détail et de Progrès ─────────────────────────────────────────

/** Ce que le détail d'une séance peut montrer à ce niveau ; les données retirent ensuite ce qui manque. */
export type DetailDensity = {
  /** Durée, ressenti et régularité : toujours. */
  distance: boolean;
  pace: boolean;
  quarters: boolean;
  hr: boolean;
  zones: boolean;
  load: boolean;
  /** Séance reconstituée (échauffement, bloc, retour au calme). */
  reconstructed: boolean;
};

export function detailDensity(level: DeclaredLevel): DetailDensity {
  const runner = level !== 'beginner';
  const athlete = level === 'advanced';
  return {
    distance: runner,
    pace: runner,
    quarters: runner,
    hr: athlete,
    zones: athlete,
    load: athlete,
    reconstructed: athlete,
  };
}

/** Ce que Progrès met en avant : semaines actives · km et sorties · charge et prédictions en fourchette. */
export type ProgressFocus = 'activeWeeks' | 'kmAndRuns' | 'loadAndPredictions';

export function progressFocus(level: DeclaredLevel): ProgressFocus {
  if (level === 'beginner') return 'activeWeeks';
  return level === 'regular' ? 'kmAndRuns' : 'loadAndPredictions';
}
