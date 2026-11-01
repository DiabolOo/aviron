import { addDays } from '../../engine';
import { candidate, ctxOf, run } from '../testUtils';
import { racePrepRule } from './racePrep';

const TODAY = '2026-10-10';
const CONFIRMED = ['race-up'];

/** 3 sorties par semaine sur 10 semaines, la plus longue faisant `longest` km. */
function history(longest: number, until = TODAY) {
  const acts = [];
  for (let i = 0; i < 30; i++) acts.push(run(`h${i}`, addDays(until, -(i * 2 + 1)), i === 10 ? longest : 6));
  return acts;
}
const upcoming = (date: string, over = {}) =>
  candidate({ id: 'race-up', date, status: 'upcoming', confidence: 'medium', ...over });

describe('race_prep', () => {
  it('returns null without a relevant race', () => {
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(9)))).toBeNull();
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [upcoming('2027-02-01')] }))).toBeNull();
  });

  it('returns null when the history does not cover the 8 weeks or has too few runs', () => {
    const races = [upcoming('2026-11-20')];
    const short = [run('a', '2026-09-20', 5), run('b', '2026-10-05', 5)];
    expect(racePrepRule.evaluate(ctxOf(TODAY, short, { races }))).toBeNull();
    const sparse = [run('a', '2026-07-01', 5), run('b', '2026-09-20', 5)];
    expect(racePrepRule.evaluate(ctxOf(TODAY, sparse, { races }))).toBeNull();
  });

  it('returns null when the longest run reaches 60 % of the distance (more than 10 days out)', () => {
    expect(racePrepRule.evaluate(ctxOf(TODAY, history(13), { races: [upcoming('2026-11-20')] }))).toBeNull();
  });

  it('advises +10 % per week when it is enough to reach 60 % before the race', () => {
    const out = racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [upcoming('2026-11-20')] }))!;
    expect(out.id).toBe('race_prep:race-up');
    expect(out.source).toBe('trend');
    expect(out.severity).toBe('notice');
    expect(out.athleteText).toContain('Passe à 9,9 km la semaine prochaine (+10 %)');
    expect(out.evidence[0].numeric).toBe(9);
    expect(out.evidence[1].value).toBe('43 %');
    expect(out.evidence[4]).toMatchObject({ numeric: 5 });
  });

  it('says the preparation is short when +10 % per week is not enough', () => {
    const out = racePrepRule.evaluate(ctxOf(TODAY, history(9), { races: [upcoming('2026-10-25')] }))!;
    expect(out.title).toBe('Préparation courte, cap sur la régularité');
    expect(out.athleteText).toContain('Préparation courte : vise une allure régulière et finis en confiance.');
    expect(out.athleteText).toContain('en 2 semaines');
    expect(out.athleteText).not.toContain('Passe à');
  });

  describe('last stretch (10 days or less)', () => {
    const final = (date: string, acts = history(9), over = {}, confirmedIds: string[] | null = CONFIRMED) =>
      racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [upcoming(date, over)], confirmedIds: confirmedIds ?? undefined }));

    it('only fires for a confirmed or declared race', () => {
      expect(final('2026-10-20', history(9), {}, null)).toBeNull();
      expect(final('2026-10-20', history(9), { goalId: 'g1' }, null)).not.toBeNull();
      expect(final('2026-10-20')).not.toBeNull();
    });

    it('gives only pace and taper advice, without criticism', () => {
      const out = final('2026-10-20')!;
      expect(out.severity).toBe('info');
      expect(out.title).toBe('Dernière ligne droite : allure et affûtage');
      expect(out.athleteText).toBe('À J-10, allège tes sorties. Pars sur une allure régulière dès le départ.');
      expect(out.evidence.map((e) => e.numeric)).toEqual([10, 21.0975]);
      expect(out.message).not.toMatch(/courte|43|44/);
    });

    it('fires whatever the preparation: long run above 60 %, no history at all', () => {
      expect(final('2026-10-20', history(15))).not.toBeNull();
      expect(final('2026-10-20', [])).not.toBeNull();
      expect(final('2026-10-20', history(30))!.title).toBe('Dernière ligne droite : allure et affûtage');
    });

    it('includes the target pace when targetTime is usable, depending on the distance', () => {
      const out = final('2026-10-11', history(9), { targetTime: '1:45:00' })!;
      expect(out.athleteText).toBe('À J-1, allège tes sorties. Vise 4:59 /km de façon régulière dès le départ.');
      expect(out.evidence[2]).toMatchObject({ numeric: 299, value: '4:59 /km' });
      expect(final('2026-10-11', history(9), { targetTime: '1h45' })!.evidence[2].numeric).toBe(299);
      expect(final('2026-10-11', history(9), { targetTime: '1:45' })!.evidence[2].numeric).toBe(299);
      const tenK = final('2026-10-11', history(9), { targetTime: '45:00', officialDistanceKm: 10 })!;
      expect(tenK.evidence[2].numeric).toBe(270);
    });

    it('omits the target pace when it is implausible or unreadable', () => {
      for (const targetTime of ['abc', '1:45', '4:00:00']) {
        const over = targetTime === '1:45' ? { targetTime, officialDistanceKm: 5 } : { targetTime };
        const out = final('2026-10-11', history(9), over)!;
        expect(out.evidence).toHaveLength(2);
        expect(out.athleteText).toContain('Pars sur une allure régulière');
      }
    });
  });

  it('ignores runs after today and non-run activities', () => {
    const acts = [...history(9), run('f', '2026-10-10', 20, undefined, { type: 'ride' }), run('g', '2026-10-11', 21)];
    const out = racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [upcoming('2026-11-20')] }))!;
    expect(out.evidence[0].numeric).toBe(9);
  });

  it('reviews a recent confirmed past race, but neither an unconfirmed nor an old one', () => {
    const past = candidate({ id: 'race-past', date: '2026-10-04', activityId: 'p' });
    const acts = history(9, '2026-10-03');
    expect(racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [past] }))).toBeNull();
    const out = racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [past], confirmedIds: ['p'] }))!;
    expect(out.severity).toBe('info');
    expect(out.athleteText).toContain('avant la course');
    expect(racePrepRule.evaluate(ctxOf('2026-12-10', acts, { races: [past], confirmedIds: ['p'] }))).toBeNull();
    expect(racePrepRule.evaluate(ctxOf(TODAY, acts, { races: [{ ...past, goalId: 'g1' }] }))).not.toBeNull();
  });
});
