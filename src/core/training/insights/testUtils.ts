import type { Activity } from '../../schemas';
import type { RaceCandidate } from '../engine';
import type { AthleteProfile } from '../types';
import type { InsightContext } from './types';

export function run(id: string, date: string, distanceKm: number, avgHr?: number, extra: Partial<Activity> = {}): Activity {
  return {
    id, name: 'Sortie', type: 'run', date, startTime: '08:00',
    durationMin: Math.round(distanceKm * 5.5 * 10) / 10, distanceKm, calories: 0, avgHr,
    ...extra,
  };
}

export const profile = (over: Partial<AthleteProfile> = {}): AthleteProfile => ({
  ageYears: 35, maxHr: 200, maxHrSource: 'configured', level: 'regular', ...over,
});

export const ctxOf = (
  today: string,
  activities: Activity[],
  over: { profile?: Partial<AthleteProfile>; races?: RaceCandidate[] } = {},
): InsightContext => ({ today, activities, profile: profile(over.profile), races: over.races ?? [] });

export function candidate(over: Partial<RaceCandidate> & Pick<RaceCandidate, 'id' | 'date'>): RaceCandidate {
  return {
    name: 'Semi', officialDistanceKm: 21.0975, status: 'completed', confidence: 'high', reasons: [], ...over,
  };
}
