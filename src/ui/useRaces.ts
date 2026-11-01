import { useMemo } from 'react';

import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import type { AthleteProfile, TrainingInsight } from '@/src/core/training/types';
import type { RaceCandidate } from '@/src/core/training/engine';
import type { Highlight, HighlightActivity } from '@/src/core/training/highlights';
import { confirmRace } from '@/src/core/training/insights/rules/confirmRace';
import { racePacing } from '@/src/core/training/insights/rules/racePacing';
import {
  isConfirmed,
  racePacingExtras,
  suggestRaceName,
  type RaceDebriefView,
} from '@/src/core/training/raceView';
import { sportDerived, type SportDerived } from '@/src/ui/sportDerived';

const ATHLETE: AthleteProfile = { level: 'regular' };

/**
 * Dérivés sport du snapshot courant (mapping, courses, index des comparables) :
 * calculés une fois par version, partagés par tous les écrans montés.
 */
export function useSportDerived(): SportDerived {
  const stravaActivities = usePulseFitStore((s) => s.activities);
  const confirmedIds = usePulseFitStore((s) => s.confirmedRaceIds);
  const rejectedIds = usePulseFitStore((s) => s.rejectedRaceIds);
  const names = usePulseFitStore((s) => s.raceNames);
  const goal = usePulseFitStore((s) => s.profile.athleticGoal);
  return sportDerived({ stravaActivities, confirmedIds, rejectedIds, names, goal });
}

export function useRaceDebrief(id: string | undefined): RaceDebriefView | undefined {
  return useSportDerived().raceDebrief(id);
}

/** activityId → raceId pour les courses confirmées (badge « Course », durée chrono, bouton débrief). */
export function useConfirmedRaceMap(): ReadonlyMap<string, string> {
  return useSportDerived().confirmedRaceMap;
}

/** Course confirmée correspondant à une activité (détail d'activité → « Voir le débrief »). */
export function useConfirmedRaceId(activityId: string | undefined): string | undefined {
  const map = useSportDerived().confirmedRaceMap;
  return activityId ? map.get(activityId) : undefined;
}

/** Moment fort d'une activité, mémoïsé sur l'index des comparables du snapshot. */
export function useActivityHighlight(activity: HighlightActivity | undefined): Highlight | null {
  const derived = useSportDerived();
  return useMemo(() => (activity ? derived.highlightFor(activity) : null), [derived, activity]);
}

export type RaceLists = { confirmed: RaceCandidate[]; pending: RaceCandidate[] };

export function useRaceLists(): RaceLists {
  const derived = useSportDerived();
  return useMemo(() => {
    const races = derived.races
      .filter((r) => r.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      confirmed: races.filter((r) => isConfirmed(r, derived.confirmedIds)),
      pending: races.filter((r) => !isConfirmed(r, derived.confirmedIds)),
    };
  }, [derived]);
}

export type RaceInsights = {
  pacing?: { insight: TrainingInsight; raceId: string; extras: string[] };
  confirm?: { insight: TrainingInsight; raceId: string; suggestedName: string };
};

const raceIdOf = (insight: TrainingInsight): string => insight.id.slice(insight.ruleId.length + 1);

/** Cartes race_pacing et confirm_race de l'Accueil (règles du moteur, sans recalcul d'affichage). */
export function useRaceInsights(): RaceInsights {
  const derived = useSportDerived();
  return useMemo(() => {
    const { races, activities, confirmedIds, goal } = derived;
    const ctx = { today: toISODate(new Date()), activities, profile: ATHLETE, races, confirmedIds };
    const out: RaceInsights = {};

    const pacing = racePacing.evaluate(ctx);
    const pacingRace = pacing && races.find((r) => r.id === raceIdOf(pacing));
    if (pacing && pacingRace) {
      out.pacing = { insight: pacing, raceId: pacingRace.id, extras: racePacingExtras(activities, pacingRace, goal) };
    }
    const confirm = confirmRace.evaluate(ctx);
    const confirmRaceCandidate = confirm && races.find((r) => r.id === raceIdOf(confirm));
    if (confirm && confirmRaceCandidate) {
      out.confirm = { insight: confirm, raceId: confirmRaceCandidate.id, suggestedName: suggestRaceName(confirmRaceCandidate) };
    }
    return out;
  }, [derived]);
}
