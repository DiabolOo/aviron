import { parseISODate } from '../dates';
import { formatHour, formatKm } from '../sportFormat';
import type { Activity } from '../schemas';
import type { AthleticGoal } from '../types';
import { daysBetween, detectRaces, raceDebrief, racePrep, type PaceBand, type RaceCandidate, type RaceDebrief } from './engine';
import { distanceNoteFr, driftSentenceFr, pacingExtrasFr } from './insights/copy.fr';
import { targetPaceSec } from './insights/helpers';
import { CONFIRM_RACE_MAX_AGE_DAYS } from './insights/thresholds';
import { racePacing } from './insights/rules/racePacing';
import type { AthleteProfile } from './types';

export type RaceChoices = {
  confirmedIds: readonly string[];
  rejectedIds: readonly string[];
  /** noms donnés par l'utilisateur à la confirmation, par id d'activité */
  names?: Readonly<Record<string, string>>;
};

export type RaceRow = {
  raceId: string;
  name: string;
  date: string;
  officialDistanceKm: number;
  timeSec?: number;
  officialPaceSec?: number;
  /** écart (secondes) au temps de la course précédente de même distance ; undefined pour la plus ancienne */
  deltaSec?: number;
  /** meilleure course de sa distance (seulement quand il y en a au moins deux) */
  best: boolean;
  current: boolean;
};

export type RaceHrView = {
  halves: NonNullable<RaceDebrief['halves']>;
  /** phrase de lecture de la dérive, absente si rien de net à dire */
  driftSentence?: string;
};

export type RacePacingView = {
  title: string;
  /** texte repris tel quel de la règle race_pacing */
  message: string;
  /** plus longue sortie des 8 semaines avant la course, allure nécessaire à l'objectif de temps */
  extras: string[];
};

export type RaceDebriefView = {
  race: RaceCandidate;
  confirmed: boolean;
  timeSec?: number;
  officialPaceSec?: number;
  distanceNote?: { short: string; detail: string };
  pacing?: RacePacingView;
  bands: PaceBand[];
  /** allure moyenne officielle, pour la ligne de référence des tranches */
  averagePaceSec?: number;
  hr?: RaceHrView;
  comparison: RaceRow[];
};

const DEFAULT_PROFILE: AthleteProfile = { level: 'regular' };

export function isConfirmed(race: RaceCandidate, confirmedIds: readonly string[]): boolean {
  return (
    race.goalId !== undefined ||
    confirmedIds.includes(race.id) ||
    (race.activityId !== undefined && confirmedIds.includes(race.activityId))
  );
}

/** Courses détectées ; la distance mesurée est celle de l'activité (pas la trace brute). */
export function detectUserRaces(activities: Activity[], choices: RaceChoices): RaceCandidate[] {
  const byId = new Map(activities.map((a) => [a.id, a]));
  return detectRaces(activities, { confirmedIds: choices.confirmedIds, rejectedIds: choices.rejectedIds }).map((race) => {
    const distanceKm = race.activityId ? byId.get(race.activityId)?.distanceKm : undefined;
    const name = race.activityId ? choices.names?.[race.activityId]?.trim() : undefined;
    return {
      ...race,
      ...(distanceKm && distanceKm > 0 ? { measuredDistanceKm: distanceKm } : {}),
      ...(name ? { name } : {}),
    };
  });
}

/** `race-<activityId>` → `<activityId>` (voir detectRaces) */
export const activityIdOfRace = (raceId: string): string => raceId.replace(/^race-/, '');

const DISTANCE_NAMES: [number, string][] = [
  [21.0975, 'Semi-marathon'],
  [42.195, 'Marathon'],
];

/** « Semi-marathon », « Marathon », « 10 km »… */
export function raceDistanceName(officialKm: number): string {
  const standard = DISTANCE_NAMES.find(([km]) => Math.abs(km - officialKm) < 0.01);
  if (standard) return standard[1];
  const rounded = Math.round(officialKm * 10) / 10;
  return `${`${rounded}`.replace('.', ',')} km`;
}

/** Nom proposé à la confirmation : « Semi-marathon de Reims 2024 » ; repli sur la date sans ville. */
export function suggestRaceName(race: Pick<RaceCandidate, 'officialDistanceKm' | 'date' | 'startCity'>): string {
  if (race.startCity) {
    return `${raceDistanceName(race.officialDistanceKm)} de ${race.startCity} ${parseISODate(race.date).getFullYear()}`;
  }
  const day = parseISODate(race.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${raceDistanceName(race.officialDistanceKm)} du ${day}`;
}

/** « dimanche 13 octobre 2024 · 08:46 · Reims · 21,3 km · 2h08:50 » — segments absents omis. */
export function candidateSummaryFr(
  race: Pick<
    RaceCandidate,
    'date' | 'startTime' | 'startCity' | 'officialDistanceKm' | 'measuredDistanceKm' | 'timeSec'
  >,
): string {
  const parts = [
    parseISODate(race.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    race.startTime ? formatHour(race.startTime) : undefined,
    race.startCity,
    formatKm(race.measuredDistanceKm ?? race.officialDistanceKm),
    race.timeSec !== undefined ? formatRaceTime(race.timeSec) : undefined,
  ];
  return parts.filter((p): p is string => p !== undefined).join(' · ');
}

export function formatRaceTime(totalSec: number): string {
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = `${m}`.padStart(2, '0');
  const ss = `${s}`.padStart(2, '0');
  return h > 0 ? `${h}h${mm}:${ss}` : `${m}:${ss}`;
}

/** « −18 min » (arrondi à la minute dès 90 s), « −45 s » en dessous, « = » si identique. */
export function formatRaceDelta(deltaSec: number): string {
  if (deltaSec === 0) return '=';
  const sign = deltaSec < 0 ? '−' : '+';
  const abs = Math.abs(deltaSec);
  return abs < 90 ? `${sign}${Math.round(abs)} s` : `${sign}${Math.round(abs / 60)} min`;
}

export function formatPaceKm(paceSec: number): string {
  const sec = Math.round(paceSec);
  return `${Math.floor(sec / 60)}:${`${sec % 60}`.padStart(2, '0')}`;
}

/** « 0 → 5,3 » : bornes d'une tranche en km, virgule décimale, sans « ,0 » inutile. */
export function formatKmRange(fromKm: number, toKm: number): string {
  const f = (n: number) => `${Math.round(n * 10) / 10}`.replace('.', ',');
  return `${f(fromKm)} → ${f(toKm)}`;
}

/** Distance visée par l'objectif athlétique (« Semi-marathon », « Marathon », « 10 km »). */
export function goalDistanceKm(goal: AthleticGoal | undefined): number | undefined {
  if (!goal || goal.type !== 'race_prep') return undefined;
  const name = goal.targetName.toLowerCase();
  if (name.includes('semi')) return 21.0975;
  if (name.includes('marathon')) return 42.195;
  const km = name.match(/(\d{1,2})\s*km/);
  return km ? Number(km[1]) : undefined;
}

export function racePacingExtras(activities: Activity[], race: RaceCandidate, goal: AthleticGoal | undefined): string[] {
  const longest = Math.max(0, ...racePrep(activities, race).weeks.map((w) => w.longestRunKm));
  const sameDistance = goalDistanceKm(goal) === race.officialDistanceKm;
  const neededPaceSec = sameDistance ? targetPaceSec(goal?.targetValue, race.officialDistanceKm) : undefined;
  return pacingExtrasFr({
    longestRunKm: longest > 0 ? Math.round(longest * 10) / 10 : undefined,
    neededPaceSec,
    targetValue: neededPaceSec !== undefined ? goal?.targetValue : undefined,
  });
}

/** Règle race_pacing évaluée pour cette course (aujourd'hui = jour de la course) + lignes d'appoint. */
export function racePacingFor(
  activities: Activity[],
  race: RaceCandidate,
  profile: AthleteProfile,
  goal: AthleticGoal | undefined,
  today: string = race.date,
): RacePacingView | undefined {
  const insight = racePacing.evaluate({ today, activities, profile, races: [race], confirmedIds: [race.id] });
  return insight ? { title: insight.title, message: insight.message, extras: racePacingExtras(activities, race, goal) } : undefined;
}

function comparisonRows(race: RaceCandidate, races: RaceCandidate[], confirmedIds: readonly string[]): RaceRow[] {
  const all = races
    .filter((r) => r.status === 'completed' && (r.id === race.id || isConfirmed(r, confirmedIds)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (all.length < 2) return [];
  const bestByDistance = new Map<number, number>();
  const countByDistance = new Map<number, number>();
  for (const r of all) {
    countByDistance.set(r.officialDistanceKm, (countByDistance.get(r.officialDistanceKm) ?? 0) + 1);
    if (r.timeSec !== undefined) {
      bestByDistance.set(r.officialDistanceKm, Math.min(bestByDistance.get(r.officialDistanceKm) ?? Infinity, r.timeSec));
    }
  }
  return all
    .map((r, i): RaceRow => {
      const prev = [...all.slice(0, i)].reverse().find((p) => p.officialDistanceKm === r.officialDistanceKm);
      return {
        raceId: r.id,
        name: r.name,
        date: r.date,
        officialDistanceKm: r.officialDistanceKm,
        timeSec: r.timeSec,
        officialPaceSec: r.timeSec !== undefined ? Math.round(r.timeSec / r.officialDistanceKm) : undefined,
        deltaSec: prev?.timeSec !== undefined && r.timeSec !== undefined ? r.timeSec - prev.timeSec : undefined,
        best:
          (countByDistance.get(r.officialDistanceKm) ?? 0) > 1 &&
          r.timeSec !== undefined &&
          r.timeSec === bestByDistance.get(r.officialDistanceKm),
        current: r.id === race.id,
      };
    })
    .reverse();
}

/** Undefined si la course (ou son activité) est introuvable. */
export function buildRaceDebriefView(
  activities: Activity[],
  choices: RaceChoices,
  raceId: string,
  profile: AthleteProfile = DEFAULT_PROFILE,
  goal?: AthleticGoal,
): RaceDebriefView | undefined {
  const races = detectUserRaces(activities, choices);
  const race = races.find((r) => r.id === raceId);
  const activity = race?.activityId ? activities.find((a) => a.id === race.activityId) : undefined;
  if (!race || !activity) return undefined;

  const debrief = raceDebrief(race, activity);
  const hasHr = debrief.halves?.first.avgHr !== undefined && debrief.halves.second.avgHr !== undefined;
  const bands = debrief.bands.filter((b) => b.officialPaceSec !== undefined);

  return {
    race,
    confirmed: isConfirmed(race, choices.confirmedIds),
    timeSec: race.timeSec,
    officialPaceSec: debrief.officialPaceSec,
    distanceNote: debrief.distance ? distanceNoteFr(debrief.distance) : undefined,
    pacing: racePacingFor(activities, race, profile, goal),
    bands,
    averagePaceSec: debrief.officialPaceSec,
    hr:
      hasHr && debrief.halves
        ? {
            halves: debrief.halves,
            driftSentence: debrief.cardiacDrift ? driftSentenceFr(debrief.cardiacDrift) : undefined,
          }
        : undefined,
    comparison: comparisonRows(race, races, choices.confirmedIds),
  };
}

/** Candidate trop ancienne pour la carte de l'Accueil (28 jours) : elle se confirme depuis la section « Courses ». */
export const isStaleCandidate = (race: Pick<RaceCandidate, 'date'>, today: string): boolean =>
  daysBetween(race.date, today) > CONFIRM_RACE_MAX_AGE_DAYS;
