import { useMemo } from 'react';

import { usePulseFitStore } from '@/lib/store';
import type { Activity } from '@/src/core/schemas';
import { groupSessions, resolveSession, type Session } from '@/src/core/training/sessions';
import { stravaToActivity } from '@/src/data/mappers';

export type ResolvedSession = {
  session: Session | undefined;
  activitiesById: Map<string, Activity>;
};

/** Séance d'un id de route (`Session.id`, ou id d'une activité qu'elle contient). */
export function useResolvedSession(id: string | undefined): ResolvedSession {
  const stravaActivities = usePulseFitStore((s) => s.activities);
  const groupOverrides = usePulseFitStore((s) => s.groupOverrides);

  return useMemo(() => {
    const mapped = stravaActivities.map(stravaToActivity);
    const activitiesById = new Map(mapped.map((a) => [a.id, a]));
    const { sessions } = groupSessions(mapped, groupOverrides);
    return { session: id ? resolveSession(sessions, id) : undefined, activitiesById };
  }, [stravaActivities, groupOverrides, id]);
}
