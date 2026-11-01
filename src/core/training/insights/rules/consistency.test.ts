import { addDays } from '../../engine';
import { ctxOf, run } from '../testUtils';
import { consistency } from './consistency';

const TODAY = '2026-11-01';
/** une séance par semaine glissante pour chaque index de `weeks` (0 = la plus ancienne) ; fenêtre : 2026-09-07 → 2026-11-01 */
const inWeeks = (weeks: number[]) => weeks.map((w) => run(`w${w}`, addDays('2026-09-07', w * 7 + 2), 6, 140));
const anchor = run('old', '2026-08-01', 6, 140);

describe('consistency', () => {
  it('returns null when the history does not cover 8 weeks', () => {
    expect(consistency.evaluate(ctxOf(TODAY, inWeeks([0, 1, 2, 3])))).toBeNull();
  });

  it('returns null with fewer than 3 sessions in the window', () => {
    expect(consistency.evaluate(ctxOf(TODAY, [anchor, ...inWeeks([6, 7])]))).toBeNull();
  });

  it('praises 6 active weeks or more', () => {
    const out = consistency.evaluate(ctxOf(TODAY, [anchor, ...inWeeks([0, 1, 2, 4, 5, 7])]))!;
    expect(out.id).toBe('consistency:2026-W44');
    expect(out.severity).toBe('info');
    expect(out.title).toContain('Belle régularité');
    expect(out.evidence[0]).toMatchObject({ numeric: 6, value: '6 / 8' });
  });

  it('encourages with 3 to 5 active weeks, and counts several sessions of a week once', () => {
    const acts = [anchor, ...inWeeks([1, 4, 6]), run('x', addDays('2026-09-07', 6 * 7 + 3), 5, 140)];
    const out = consistency.evaluate(ctxOf(TODAY, acts))!;
    expect(out.evidence[0].numeric).toBe(3);
    expect(out.evidence[1].numeric).toBe(4);
    expect(out.title).toContain('base à consolider');
  });

  it('encourages gently with 1 or 2 active weeks', () => {
    const out = consistency.evaluate(ctxOf(TODAY, [anchor, run('a', '2026-10-30', 6), run('b', '2026-10-31', 6), run('c', '2026-11-01', 6)]))!;
    expect(out.evidence[0].numeric).toBe(1);
    expect(out.title).toContain('petite séance');
    expect(out.athleteText).toContain('1 semaine active sur 8');
  });
});
