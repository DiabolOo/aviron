import {
  activityToStrava,
  plannedToSession,
  sessionToPlanned,
  stravaToActivity,
} from './mappers';

describe('activityToStrava / stravaToActivity', () => {
  const strava = {
    id: 'act-1',
    name: 'Footing',
    type: 'run' as const,
    date: '2026-10-29',
    startTime: '07:15',
    distanceKm: 8.1,
    durationMin: 50,
    movingTimeMin: 48,
    elevationM: 42,
    calories: 520,
    avgHr: 142,
    maxHr: 165,
    splits: [{ km: 1, pace: '5:55', paceSec: 355, elevationGain: 5, avgHr: 140 }],
    hrStream: [120, 140, 150],
    polyline: [{ x: 0.5, y: 0.5 }],
  };

  it('convertit durationMin et movingTimeMin ↔ movingTimeSec, source strava', () => {
    const activity = stravaToActivity(strava);
    expect(activity.durationMin).toBe(50);
    expect(activity.movingTimeSec).toBe(2880);
    expect(activity.source).toBe('strava');
    expect(activity.splits).toEqual(strava.splits);
    expect(activity.hrStream).toEqual(strava.hrStream);
    expect(activity.polyline).toEqual(strava.polyline);
  });

  it('fait un aller-retour sans perte', () => {
    const roundTrip = activityToStrava(stravaToActivity(strava));
    expect(roundTrip).toEqual({ ...strava, movingTimeSec: 2880 });
  });

  it('fournit des valeurs par défaut pour les champs optionnels, sans 0', () => {
    const ui = activityToStrava({
      id: 'a', name: 'Marche', type: 'walk', date: '2026-10-29',
      startTime: '10:00', durationMin: 30, calories: 150,
      source: 'manual', aiEligible: true,
    });
    expect(ui.splits).toEqual([]);
    expect(ui.hrStream).toEqual([]);
    expect(ui.polyline).toEqual([]);
    expect(ui.distanceKm).toBeUndefined();
    expect(ui.movingTimeMin).toBeUndefined();
    expect(ui.avgHr).toBeUndefined();
  });
});

describe('sessionToPlanned / plannedToSession', () => {
  const session = {
    id: 's1',
    date: '2026-10-30',
    title: 'Séance Push',
    kind: 'strength' as const,
    subtitle: 'Pecs',
    durationMin: 55,
    caloriesBurn: 380,
    completed: false,
    exercises: [{ id: 'e1', name: 'Dips', sets: 3, reps: '10', restSec: 75 }],
  };

  it('convertit caloriesBurn ↔ targetCaloriesBurn', () => {
    const planned = sessionToPlanned(session);
    expect(planned.targetCaloriesBurn).toBe(380);
    expect(plannedToSession(planned)).toEqual(session);
  });

  it('mappe le kind other vers strength côté UI', () => {
    const ui = plannedToSession({
      id: 'w1', date: '2026-10-30', title: 'HIIT', kind: 'other',
      subtitle: '', durationMin: 30, targetCaloriesBurn: 300, completed: false,
    });
    expect(ui.kind).toBe('strength');
  });
});
