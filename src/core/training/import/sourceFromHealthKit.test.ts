import { sourceFromHealthKit } from './sourceFromHealthKit';

describe('sourceFromHealthKit', () => {
  it('bundle id Strava → source strava, aiEligible false', () => {
    expect(sourceFromHealthKit('com.strava.StravaUniverse')).toEqual({ source: 'strava', aiEligible: false });
    expect(sourceFromHealthKit('com.strava')).toEqual({ source: 'strava', aiEligible: false });
  });

  it('Apple natif (health) → apple_health, aiEligible true', () => {
    expect(sourceFromHealthKit('com.apple.health')).toEqual({ source: 'apple_health', aiEligible: true });
    expect(sourceFromHealthKit('com.apple.workout.app')).toEqual({ source: 'apple_health', aiEligible: true });
    expect(sourceFromHealthKit('com.apple.fitness')).toEqual({ source: 'apple_health', aiEligible: true });
  });

  it('COROS → source coros, aiEligible true', () => {
    expect(sourceFromHealthKit('com.coros.app')).toEqual({ source: 'coros', aiEligible: true });
  });

  it('Garmin → source garmin, aiEligible true', () => {
    expect(sourceFromHealthKit('com.garmin.connect.mobile')).toEqual({ source: 'garmin', aiEligible: true });
  });

  it('écrivain inconnu → apple_health, aiEligible false (défaut prudent)', () => {
    expect(sourceFromHealthKit('com.nike.runclub')).toEqual({ source: 'apple_health', aiEligible: false });
    expect(sourceFromHealthKit('com.polar.flow')).toEqual({ source: 'apple_health', aiEligible: false });
    expect(sourceFromHealthKit('com.wahoo')).toEqual({ source: 'apple_health', aiEligible: false });
    expect(sourceFromHealthKit('com.unknown.app')).toEqual({ source: 'apple_health', aiEligible: false });
  });

  it('insensible à la casse', () => {
    expect(sourceFromHealthKit('COM.STRAVA.APP')).toEqual({ source: 'strava', aiEligible: false });
    expect(sourceFromHealthKit('Com.Apple.Health')).toEqual({ source: 'apple_health', aiEligible: true });
  });

  it('strava toujours non éligible, peu importe le device', () => {
    // La source est le canal d'import (bundle id), pas l'appareil.
    // Un Garmin importé via l'app Strava → strava, non éligible.
    expect(sourceFromHealthKit('com.strava.garmin.sync')).toEqual({ source: 'strava', aiEligible: false });
  });
});
