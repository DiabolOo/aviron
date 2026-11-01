import { candidate, ctxOf, run } from '../testUtils';
import { confirmRace } from './confirmRace';

const TODAY = '2026-10-15';
const semi = run('semi', '2026-10-11', 21.9, undefined, { name: 'Semi' });
const race = candidate({ id: 'race-semi', date: '2026-10-11', activityId: 'semi', measuredDistanceKm: 21.9 });

describe('confirm_race', () => {
  it('returns null without candidate', () => {
    expect(confirmRace.evaluate(ctxOf(TODAY, [semi]))).toBeNull();
  });

  it('asks for confirmation of an unconfirmed high-confidence candidate, without debrief figures', () => {
    const out = confirmRace.evaluate(ctxOf(TODAY, [semi], { races: [race] }))!;
    expect(out.id).toBe('confirm_race:race-semi');
    expect(out.title).toBe('C’était une course ?');
    expect(out.source).toBe('trend');
    expect(out.evidence.map((e) => e.numeric)).toEqual([21.9, 4]);
    expect(out.message).not.toMatch(/\/km|moitié|quart/);
  });

  it('is silent once the race is confirmed (by activity id, race id) or declared as a goal', () => {
    for (const confirmedIds of [['semi'], ['race-semi']]) {
      expect(confirmRace.evaluate(ctxOf(TODAY, [semi], { races: [race], confirmedIds }))).toBeNull();
    }
    expect(confirmRace.evaluate(ctxOf(TODAY, [semi], { races: [{ ...race, goalId: 'g1' }] }))).toBeNull();
  });

  it('ignores medium candidates, upcoming races and old races', () => {
    expect(confirmRace.evaluate(ctxOf(TODAY, [semi], { races: [{ ...race, confidence: 'medium' }] }))).toBeNull();
    expect(confirmRace.evaluate(ctxOf(TODAY, [semi], { races: [{ ...race, status: 'upcoming' }] }))).toBeNull();
    expect(confirmRace.evaluate(ctxOf('2026-12-15', [semi], { races: [race] }))).toBeNull();
  });
});
