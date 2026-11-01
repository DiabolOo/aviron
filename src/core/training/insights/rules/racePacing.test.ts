import type { Activity } from '../../../schemas';
import { candidate, ctxOf, run } from '../testUtils';
import { racePacing } from './racePacing';

/** Semi (21,1 km) avec un split par km ; `pace(km)` donne l'allure en s/km. */
function semi(pace: (km: number) => number, over: Partial<Activity> = {}): Activity {
  const splits = Array.from({ length: 21 }, (_, i) => ({
    km: i + 1, pace: '', paceSec: pace(i + 1), elevationGain: 0,
  }));
  splits.push({ km: 21.1, pace: '', paceSec: pace(22), elevationGain: 0 });
  return run('semi', '2026-10-11', 21.1, undefined, { name: 'Semi', splits, ...over });
}
const race = candidate({ id: 'race-semi', date: '2026-10-11', activityId: 'semi', measuredDistanceKm: 21.1 });
const TODAY = '2026-10-15';
const fastStart = (km: number) => (km <= 10.5 ? 300 : 330);

describe('race_pacing', () => {
  it('returns null without matching activity or splits', () => {
    expect(racePacing.evaluate(ctxOf(TODAY, [], { races: [race] }))).toBeNull();
    expect(racePacing.evaluate(ctxOf(TODAY, [semi(() => 300, { splits: undefined })], { races: [race] }))).toBeNull();
  });

  it('returns null for medium-confidence, upcoming or old races', () => {
    const acts = [semi(fastStart)];
    expect(racePacing.evaluate(ctxOf(TODAY, acts, { races: [{ ...race, confidence: 'medium' }] }))).toBeNull();
    expect(racePacing.evaluate(ctxOf(TODAY, acts, { races: [{ ...race, status: 'upcoming' }] }))).toBeNull();
    expect(racePacing.evaluate(ctxOf('2026-12-15', acts, { races: [race] }))).toBeNull();
  });

  it('returns null when splits cover less than 90 % of the distance', () => {
    const a = semi(() => 300);
    a.splits = a.splits!.slice(0, 15);
    expect(racePacing.evaluate(ctxOf(TODAY, [a], { races: [race] }))).toBeNull();
  });

  it('returns null for even pacing', () => {
    expect(racePacing.evaluate(ctxOf(TODAY, [semi(() => 300)], { races: [race] }))).toBeNull();
  });

  it('flags a fast start when the 2nd half is more than 5 % slower', () => {
    const out = racePacing.evaluate(ctxOf(TODAY, [semi(fastStart)], { races: [race] }))!;
    expect(out.id).toBe('race_pacing:race-semi');
    expect(out.title).toContain('trop rapide');
    expect(out.severity).toBe('notice');
    expect(out.evidence[2].numeric).toBeGreaterThan(5);
  });

  it('does not flag a 4 % slowdown', () => {
    const slight = (km: number) => (km <= 10.5 ? 300 : 312);
    expect(racePacing.evaluate(ctxOf(TODAY, [semi(slight)], { races: [race] }))).toBeNull();
  });

  it('flags a cautious start when the 1st quarter is more than 5 % slower than the average', () => {
    const cautious = (km: number) => (km <= 5 ? 330 : 300);
    const out = racePacing.evaluate(ctxOf(TODAY, [semi(cautious)], { races: [race] }))!;
    expect(out.title).toContain('trop prudent');
    expect(out.severity).toBe('info');
    expect(out.evidence[2].numeric).toBeGreaterThan(5);
  });
});
