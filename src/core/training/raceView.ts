import { parseISODate } from '../dates';
import { formatHour, formatKm } from '../sportFormat';
import type { Activity } from '../schemas';
import type { AthleticGoal } from '../types';
import { daysBetween, detectRaces, raceDebrief, racePrep, type PaceBand, type RaceCandidate, type RaceDebrief } from './engine';
import type { Highlight } from './highlights';
import {
  approxDuration,
  distanceNoteFr,
  driftSentenceFr,
  highlightCopyFr,
  PACING_LABELS,
  pacingExtrasFr,
  pacingSummaryFr,
} from './insights/copy.fr';
import { parseTargetTime, targetPaceSec } from './insights/helpers';
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
  /** une phrase avec le chiffre clé (affichée sous le titre) */
  summary: string;
  /** explication de la règle, pour le bloc « Pourquoi ? » */
  why: string;
  /** gain estimé (s) avec une allure régulière ; undefined s'il n'est pas calculable */
  gainSec?: number;
};

export type RaceDebriefView = {
  race: RaceCandidate;
  /** nom de la course : celui choisi par l'utilisateur, sinon suggestion (distance + ville + année) */
  title: string;
  /** titre d'origine de l'activité, s'il diffère du titre affiché */
  originalName?: string;
  confirmed: boolean;
  timeSec?: number;
  officialPaceSec?: number;
  distanceNote?: { short: string; detail: string };
  pacing?: RacePacingView;
  bands: PaceBand[];
  /** allure moyenne officielle, pour la ligne de référence des tranches */
  averagePaceSec?: number;
  hr?: RaceHrView;
  /** allures officielles des deux moitiés (avec ou sans FC) */
  halfPaces?: { first: number; second: number };
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
    raceKm: race.officialDistanceKm,
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
  if (!insight) return undefined;
  const activity = activities.find((a) => a.id === race.activityId);
  const { halves, bands, officialPaceSec } = activity ? raceDebrief(race, activity) : { halves: undefined, bands: [], officialPaceSec: undefined };
  const evidence = (label: string): number | undefined => insight.evidence.find((e) => e.label === label)?.numeric;
  const fastGap = evidence(PACING_LABELS.gapHalves);
  const cautiousGap = evidence(PACING_LABELS.gapQuarter);
  const even = officialPaceSec ?? (halves ? Math.round((halves.first.officialPaceSec + halves.second.officialPaceSec) / 2) : undefined);
  const q1 = bands[0]?.officialPaceSec;
  let gainSec: number | undefined;
  if (fastGap !== undefined && halves && even !== undefined) gainSec = (halves.second.officialPaceSec - even) * (race.officialDistanceKm / 2);
  else if (cautiousGap !== undefined && q1 !== undefined && even !== undefined) gainSec = (q1 - even) * (race.officialDistanceKm / 4);
  const gapPct = fastGap ?? cautiousGap;
  return {
    title: insight.title,
    message: insight.message,
    extras: racePacingExtras(activities, race, goal),
    summary:
      gapPct !== undefined
        ? pacingSummaryFr({ kind: fastGap !== undefined ? 'fast' : 'cautious', gapPct, gainSec })
        : insight.message,
    why: insight.why,
    gainSec: gainSec !== undefined && gainSec > 0 ? gainSec : undefined,
  };
}

/** Une carte de l'Accueil reste affichée 7 jours après la course, puis disparaît. */
export const HOME_RACE_MAX_AGE_DAYS = 7;

export type RaceCardView = {
  raceId: string;
  title: string;
  timeSec: number;
  /** écart à l'objectif s'il existe, sinon gain estimé ; absent si aucun des deux n'est calculable */
  line?: string;
};

/** Écart (s) entre le chrono et l'objectif de temps, si l'objectif vise la même distance et se lit sans ambiguïté. */
export function goalGapSec(view: RaceDebriefView, goal: AthleticGoal | undefined): number | undefined {
  if (view.timeSec === undefined || goalDistanceKm(goal) !== view.race.officialDistanceKm) return undefined;
  const target = parseTargetTime(goal?.targetValue, view.race.officialDistanceKm);
  return target === undefined ? undefined : view.timeSec - target;
}

/** Carte de l'Accueil : undefined si la course n'est pas confirmée, sans chrono, future ou trop ancienne. */
export function homeRaceCard(
  view: RaceDebriefView,
  goal: AthleticGoal | undefined,
  today: string,
): RaceCardView | undefined {
  const age = daysBetween(view.race.date, today);
  if (!view.confirmed || view.timeSec === undefined || view.race.status !== 'completed' || age < 0 || age > HOME_RACE_MAX_AGE_DAYS) {
    return undefined;
  }
  const gap = goalGapSec(view, goal);
  const gain = view.pacing?.gainSec;
  const line =
    gap !== undefined
      ? `${formatRaceDelta(gap)} par rapport à ton objectif (${goal?.targetValue})`
      : gain !== undefined
        ? `Jusqu’à environ ${approxDuration(gain)} à gagner avec une allure plus régulière`
        : undefined;
  return { raceId: view.race.id, title: view.title, timeSec: view.timeSec, line };
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

/** Undefined si la course (ou son activité) est introuvable. `races` précalculées = pas de redétection. */
export function buildRaceDebriefViewFromRaces(
  activities: Activity[],
  races: RaceCandidate[],
  choices: RaceChoices,
  raceId: string,
  profile: AthleteProfile = DEFAULT_PROFILE,
  goal?: AthleticGoal,
): RaceDebriefView | undefined {
  const race = races.find((r) => r.id === raceId);
  const activity = race?.activityId ? activities.find((a) => a.id === race.activityId) : undefined;
  if (!race || !activity) return undefined;

  const debrief = raceDebrief(race, activity);
  const hasHr = debrief.halves?.first.avgHr !== undefined && debrief.halves.second.avgHr !== undefined;
  const bands = debrief.bands.filter((b) => b.officialPaceSec !== undefined);

  const chosen = choices.names?.[activity.id]?.trim();
  const title = chosen || suggestRaceName(race);

  return {
    race,
    title,
    originalName: activity.name && activity.name !== title ? activity.name : undefined,
    confirmed: isConfirmed(race, choices.confirmedIds),
    timeSec: race.timeSec,
    officialPaceSec: debrief.officialPaceSec,
    distanceNote: debrief.distance ? distanceNoteFr(debrief.distance) : undefined,
    pacing: racePacingFor(activities, race, profile, goal),
    bands,
    averagePaceSec: debrief.officialPaceSec,
    halfPaces: debrief.halves
      ? { first: debrief.halves.first.officialPaceSec, second: debrief.halves.second.officialPaceSec }
      : undefined,
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

/** Undefined si la course (ou son activité) est introuvable. */
export function buildRaceDebriefView(
  activities: Activity[],
  choices: RaceChoices,
  raceId: string,
  profile: AthleteProfile = DEFAULT_PROFILE,
  goal?: AthleticGoal,
): RaceDebriefView | undefined {
  return buildRaceDebriefViewFromRaces(activities, detectUserRaces(activities, choices), choices, raceId, profile, goal);
}

/** Candidate trop ancienne pour la carte de l'Accueil (28 jours) : elle se confirme depuis la section « Courses ». */
export const isStaleCandidate = (race: Pick<RaceCandidate, 'date'>, today: string): boolean =>
  daysBetween(race.date, today) > CONFIRM_RACE_MAX_AGE_DAYS;

/** Seconde moitié plus rapide d'au moins 2 % pour en faire le moment fort d'une course. */
export const RACE_NEGATIVE_SPLIT_MIN_PCT = 2;
/** « La même course l'année d'avant » : 365 jours à ±45 jours près, même distance officielle. */
export const SAME_RACE_WINDOW_DAYS = 45;

/** Moment fort orienté course : 2e moitié plus rapide, sinon écart avec la même course l'année d'avant. */
export function raceHighlight(view: RaceDebriefView): Highlight | null {
  const halves = view.halfPaces;
  if (halves && (halves.first - halves.second) / halves.first >= RACE_NEGATIVE_SPLIT_MIN_PCT / 100) {
    const gain = Math.round(halves.first - halves.second);
    return { kind: 'race_negative_split', tone: 'accent', ...highlightCopyFr('race_negative_split', { beginner: false, gainSecPerKm: gain }) };
  }
  const current = view.comparison.find((r) => r.current);
  if (!current || current.timeSec === undefined) return null;
  const lastYear = view.comparison.find(
    (r) =>
      !r.current &&
      r.timeSec !== undefined &&
      r.officialDistanceKm === current.officialDistanceKm &&
      Math.abs(daysBetween(r.date, current.date) - 365) <= SAME_RACE_WINDOW_DAYS,
  );
  if (!lastYear || lastYear.timeSec === undefined) return null;
  return {
    kind: 'race_vs_last_year',
    tone: 'accent',
    ...highlightCopyFr('race_vs_last_year', {
      beginner: false,
      deltaLabel: formatRaceDelta(current.timeSec - lastYear.timeSec),
      lastYearTime: formatRaceTime(lastYear.timeSec),
    }),
  };
}

export interface RaceSummary {
  raceId: string;
  /** nom de la course (choisi par l'utilisateur, sinon suggestion avec la ville) */
  title: string;
  /** titre d'origine de l'activité, s'il diffère du nom affiché */
  originalName?: string;
  /** chrono (temps écoulé) */
  timeSec?: number;
  /** allure officielle : chrono / distance officielle */
  officialPaceSec?: number;
  officialKm: number;
  /** distance de l'activité (GPS) */
  measuredKm?: number;
  highlight: Highlight | null;
}

/** Ce que l'écran de détail d'une course confirmée affiche : chrono, allure officielle, distances, moment fort. */
export function raceSummary(view: RaceDebriefView): RaceSummary {
  return {
    raceId: view.race.id,
    title: view.title,
    originalName: view.originalName,
    timeSec: view.timeSec,
    officialPaceSec: view.officialPaceSec,
    officialKm: view.race.officialDistanceKm,
    measuredKm: view.race.measuredDistanceKm,
    highlight: raceHighlight(view),
  };
}
