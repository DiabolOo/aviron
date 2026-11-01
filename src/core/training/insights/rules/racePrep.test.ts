import { addDays } from '../../engine';
import { candidate, ctxOf, run } from '../testUtils';
import { racePrepRule } from './racePrep';

const TODAY = '2026-10-10';

/** 3 sorties par semaine sur 10 semaines, la plus longue faisant `longest` km. */
function history(longest: number, until = TODAY) {
  const acts = [];
  for (let i = 0; i < 30; i++) acts.push(run(`h${i}`, addDays(until, -(i * 2 + 1)), i === 10 ? longest : 6));
  return acts;
}
const upcoming = candidate({ id: 'race-up', date: '2026-10-11', status: 'upcoming', confidence: 'medium' });

describe('race_prep', () => {
  it('returns null without a relevant race', () => {
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(9)))).toBeNull();
    const far = { ...upcoming, date: '2027-02-01' };
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [far] }))).toBeNull();
  });

  it('returns null when the history does not cover the 8 weeks or has too few runs', () => {
    const short = [run('a', '2026-09-20', 5), run('b', '2026-10-05', 5)];
    expect(racePrepRule.evaluate(ctxOf(TODAY, short, { races: [upcoming] }))).toBeNull();
    const sparse = [run('a', '2026-07-01', 5), run('b', '2026-09-20', 5)];
    expect(racePrepRule.evaluate(ctxOf(TODAY, sparse, { races: [upcoming] }))).toBeNull();
  });

  it('returns null when the longest run reaches 60 % of the distance', () => {
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(13), { races: [upcoming] }))).toBeNull();
  });

  it('triggers for an upcoming race and gives the last-minute advice close to the date', () => {
    const out = racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [upcoming] }))!;
    expect(out.id).toBe('race_prep:race-up');
    expect(out.severity).toBe('notice');
    expect(out.evidence[0].numeric).toBe(9);
    expect(out.evidence[1].value).toBe('43 %');
    expect(out.athleteText).toContain('ne cherche pas à rattraper');
    const farther = { ...upcoming, date: '2026-11-20' };
    const early = racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [farther] }))!;
    expect(early.athleteText).toContain('Rallonge ta sortie longue');
  });

  it('ignores runs after today and non-run activities', () => {
    const acts = [...history(9), run('f', '2026-10-10', 20, undefined, { type: 'ride' }), run('g', '2026-10-11', 21)];
    const out = racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [upcoming] }))!;
    expect(out.evidence[0].numeric).toBe(9);
  });

  it('reviews a recent past race but not an old one', () => {
    const past = candidate({ id: 'race-past', date: '2026-10-04' });
    const acts = history(9, '2026-10-03');
    const out = racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [past] }))!;
    expect(out.severity).toBe('info');
    expect(out.athleteText).toContain('avant la course');
    expect(racePrepRule.evaluate(ctxOf('2026-12-10', acts, { races: [past] }))).toBeNull();
  });
});
