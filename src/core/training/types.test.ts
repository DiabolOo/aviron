import {
  ActivitySchema,
  AthleteProfileSchema,
  DailyMetricsSchema,
  RaceSchema,
  SplitSchema,
  TrainingInsightSchema,
} from './types';

describe('training types', () => {
  it('reuses the J3 Activity schema', () => {
    const a = ActivitySchema.parse({
      id: 'a1', name: 'Sortie', type: 'run', date: '2025-03-02', startTime: '08:00',
      durationMin: 50, distanceKm: 10, calories: 600,
      source: 'manual', aiEligible: true,
      splits: [{ km: 1, pace: '5:00', paceSec: 300, elevationGain: 2, avgHr: 150 }],
    });
    expect(a.splits?.[0]).toEqual(SplitSchema.parse(a.splits?.[0]));
  });

  it('validates daily metrics, race, athlete profile and insight', () => {
    expect(DailyMetricsSchema.safeParse({
      date: '2025-03-02', activityCount: 1, durationMin: 50, distanceKm: 10, elevationM: 20, load: 80,
    }).success).toBe(true);
    expect(RaceSchema.safeParse({
      id: 'r1', name: 'Reims', date: '2025-10-19', officialDistanceKm: 21.0975, timeSec: 6650, status: 'completed',
    }).success).toBe(true);
    expect(AthleteProfileSchema.parse({ maxHr: 201, maxHrSource: 'observed' }).level).toBe('beginner');
    expect(TrainingInsightSchema.safeParse({
      id: 'i1', date: '2025-03-02', source: 'trend', message: 'm', confidence: 0.8,
      ruleId: 'intensity', severity: 'warning', title: 't', beginnerText: 'b', athleteText: 'a',
      evidence: [{ label: 'Sorties > 160 bpm', value: '53 %' }], why: 'w',
    }).success).toBe(true);
  });

  it('accepts a split without HR, an activity without calories and a swim', () => {
    expect(SplitSchema.safeParse({ km: 1, pace: '5:00', paceSec: 300, elevationGain: 0 }).success).toBe(true);
    const a = ActivitySchema.parse({
      id: 'a2', name: 'Piscine', type: 'swim', date: '2025-03-03', startTime: '12:00',
      startedAt: '2025-03-03T12:00:00+01:00', durationMin: 40,
      source: 'manual', aiEligible: true,
    });
    expect(a.calories).toBeUndefined();
    expect(a.type).toBe('swim');
  });

  it('allows an athlete profile without maxHr and defaults level to beginner', () => {
    const p = AthleteProfileSchema.parse({});
    expect(p.maxHr).toBeUndefined();
    expect(p.level).toBe('beginner');
    expect(AthleteProfileSchema.safeParse({ maxHr: 190, maxHrSource: 'estimated' }).success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(AthleteProfileSchema.safeParse({ maxHr: 50, maxHrSource: 'observed' }).success).toBe(false);
    expect(RaceSchema.safeParse({ id: 'r', name: 'x', date: 'bad', officialDistanceKm: 10, status: 'upcoming' }).success).toBe(false);
  });
});
