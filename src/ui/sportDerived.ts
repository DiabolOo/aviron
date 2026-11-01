import type { Activity } from '@/src/core/schemas';
import type { AthleteProfile } from '@/src/core/training/types';
import type { RaceCandidate } from '@/src/core/training/engine';
import {
  comparablesIndex,
  highlightOfIndexed,
  type Highlight,
  type HighlightActivity,
} from '@/src/core/training/highlights';
import {
  buildRaceDebriefViewFromRaces,
  detectUserRaces,
  isConfirmed,
  raceSummary,
  type RaceChoices,
  type RaceDebriefView,
  type RaceSummary,
} from '@/src/core/training/raceView';
import type { AthleticGoal, StravaActivity } from '@/src/core/types';
import { stravaToActivity } from '@/src/data/mappers';

const ATHLETE: AthleteProfile = { level: 'regular' };

/** Entrées du calcul dérivé : les références viennent du store (stables entre deux versions). */
export interface SportSnapshot {
  stravaActivities: readonly StravaActivity[];
  confirmedIds: readonly string[];
  rejectedIds: readonly string[];
  names: Readonly<Record<string, string>>;
  goal: AthleticGoal | undefined;
}

export interface SportDerived {
  /** activités au format schéma (mappées une fois) */
  activities: Activity[];
  confirmedIds: readonly string[];
  goal: AthleticGoal | undefined;
  races: RaceCandidate[];
  /** activityId → raceId pour les courses confirmées (badge « Course », chrono). */
  confirmedRaceMap: ReadonlyMap<string, string>;
  /** moment fort, mémoïsé par id d'activité sur l'index des comparables */
  highlightFor(activity: HighlightActivity): Highlight | null;
  raceDebrief(raceId: string | undefined): RaceDebriefView | undefined;
  raceSummaryFor(raceId: string | undefined): RaceSummary | undefined;
}

let cache: { key: SportSnapshot; value: SportDerived } | undefined;

/**
 * Données dérivées du snapshot sport : mapping, détection des courses, index des
 * comparables — calculés une seule fois par version (clé = références du store,
 * donc toute mise à jour invalide). Moments forts et débriefs sont mémoïsés par id.
 */
export function sportDerived(key: SportSnapshot): SportDerived {
  if (
    cache &&
    cache.key.stravaActivities === key.stravaActivities &&
    cache.key.confirmedIds === key.confirmedIds &&
    cache.key.rejectedIds === key.rejectedIds &&
    cache.key.names === key.names &&
    cache.key.goal === key.goal
  ) {
    return cache.value;
  }

  const activities = key.stravaActivities.map(stravaToActivity);
  const choices: RaceChoices = {
    confirmedIds: key.confirmedIds,
    rejectedIds: key.rejectedIds,
    names: key.names,
  };
  const races = detectUserRaces(activities, choices);
  const confirmedRaceMap = new Map<string, string>();
  for (const race of races) {
    if (race.activityId && isConfirmed(race, key.confirmedIds)) {
      confirmedRaceMap.set(race.activityId, race.id);
    }
  }
  const index = comparablesIndex(key.stravaActivities);

  const highlights = new Map<string, Highlight | null>();
  const debriefs = new Map<string, RaceDebriefView | undefined>();
  const summaries = new Map<string, RaceSummary | undefined>();

  const value: SportDerived = {
    activities,
    confirmedIds: key.confirmedIds,
    goal: key.goal,
    races,
    confirmedRaceMap,
    highlightFor(activity) {
      if (!highlights.has(activity.id)) {
        highlights.set(activity.id, highlightOfIndexed(activity, index));
      }
      return highlights.get(activity.id) ?? null;
    },
    raceDebrief(raceId) {
      if (raceId === undefined) return undefined;
      if (!debriefs.has(raceId)) {
        debriefs.set(
          raceId,
          buildRaceDebriefViewFromRaces(activities, races, choices, raceId, ATHLETE, key.goal),
        );
      }
      return debriefs.get(raceId);
    },
    raceSummaryFor(raceId) {
      if (raceId === undefined) return undefined;
      if (!summaries.has(raceId)) {
        const view = value.raceDebrief(raceId);
        summaries.set(raceId, view ? raceSummary(view) : undefined);
      }
      return summaries.get(raceId);
    },
  };

  cache = { key, value };
  return value;
}
