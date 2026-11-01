import { useMemo } from 'react';

import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import type { AthleteProfile, TrainingInsight } from '@/src/core/training/types';
import type { RaceCandidate } from '@/src/core/training/engine';
import { confirmRace } from '@/src/core/training/insights/rules/confirmRace';
import { racePacing } from '@/src/core/training/insights/rules/racePacing';
import {
  buildRaceDebriefView,
  detectUserRaces,
  isConfirmed,
  racePacingExtras,
  suggestRaceName,
  type RaceDebriefView,
} from '@/src/core/training/raceView';
import { stravaToActivity } from '@/src/data/mappers';

const ATHLETE: AthleteProfile = { level: 'regular' };

function useRaceInputs() {
  const stravaActivities = usePulseFitStore((s) => s.activities);
  const confirmedIds = usePulseFitStore((s) => s.confirmedRaceIds);
  const rejectedIds = usePulseFitStore((s) => s.rejectedRaceIds);
  const names = usePulseFitStore((s) => s.raceNames);
  const goal = usePulseFitStore((s) => s.profile.athleticGoal);
  const activities = useMemo(() => stravaActivities.map(stravaToActivity), [stravaActivities]);
  return { activities, confirmedIds, rejectedIds, names, goal };
}

export function useRaceDebrief(id: string | undefined): RaceDebriefView | undefined {
  const { activities, confirmedIds, rejectedIds, names, goal } = useRaceInputs();
  return useMemo(
    () => (id ? buildRaceDebriefView(activities, { confirmedIds, rejectedIds, names }, id, ATHLETE, goal) : undefined),
    [activities, confirmedIds, rejectedIds, names, goal, id],
  );
}

/** activityId → raceId pour les courses confirmées (badge « Course », durée chrono, bouton débrief). */
export function useConfirmedRaceMap(): ReadonlyMap<string, string> {
  const { activities, confirmedIds, rejectedIds, names } = useRaceInputs();
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const race of detectUserRaces(activities, { confirmedIds, rejectedIds, names })) {
      if (race.activityId && isConfirmed(race, confirmedIds)) map.set(race.activityId, race.id);
    }
    return map;
  }, [activities, confirmedIds, rejectedIds, names]);
}

/** Course confirmée correspondant à une activité (détail d'activité → « Voir le débrief »). */
export function useConfirmedRaceId(activityId: string | undefined): string | undefined {
  const map = useConfirmedRaceMap();
  return activityId ? map.get(activityId) : undefined;
}

export type RaceLists = { confirmed: RaceCandidate[]; pending: RaceCandidate[] };

export function useRaceLists(): RaceLists {
  const { activities, confirmedIds, rejectedIds, names } = useRaceInputs();
  return useMemo(() => {
    const races = detectUserRaces(activities, { confirmedIds, rejectedIds, names })
      .filter((r) => r.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      confirmed: races.filter((r) => isConfirmed(r, confirmedIds)),
      pending: races.filter((r) => !isConfirmed(r, confirmedIds)),
    };
  }, [activities, confirmedIds, rejectedIds, names]);
}

export type RaceInsights = {
  pacing?: { insight: TrainingInsight; raceId: string; extras: string[] };
  confirm?: { insight: TrainingInsight; raceId: string; suggestedName: string };
};

const raceIdOf = (insight: TrainingInsight): string => insight.id.slice(insight.ruleId.length + 1);

/** Cartes race_pacing et confirm_race de l'Accueil (règles du moteur, sans recalcul d'affichage). */
export function useRaceInsights(): RaceInsights {
  const { activities, confirmedIds, rejectedIds, names, goal } = useRaceInputs();
  return useMemo(() => {
    const races = detectUserRaces(activities, { confirmedIds, rejectedIds, names });
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
  }, [activities, confirmedIds, rejectedIds, names, goal]);
}
