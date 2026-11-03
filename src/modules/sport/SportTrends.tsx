import { useMemo } from 'react';

import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { buildSportTrends } from '@/src/core/training/engine';
import { stravaToActivity } from '@/src/data/mappers';
import { SportTrendsCard } from '@/src/modules/sport/SportTrendsCard';

export function SportTrends() {
  const activities = usePulseFitStore((s) => s.activities);
  const profile = usePulseFitStore((s) => s.profile);
  const trends = useMemo(
    () =>
      buildSportTrends({
        activities: activities.map(stravaToActivity),
        today: toISODate(new Date()),
        configuredMaxHr: profile.maxHr,
        ageYears: profile.ageYears,
      }),
    [activities, profile.maxHr, profile.ageYears],
  );

  return <SportTrendsCard trends={trends} />;
}
