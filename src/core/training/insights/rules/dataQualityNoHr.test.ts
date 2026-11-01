import { ctxOf, run } from '../testUtils';
import { dataQualityNoHr } from './dataQualityNoHr';

const dates = ['2026-10-01', '2026-10-04', '2026-10-08', '2026-10-12', '2026-10-15'];

describe('data_quality_no_hr', () => {
  it('returns null with fewer than 5 runs', () => {
    const acts = dates.slice(0, 4).map((d, i) => run(`r${i}`, d, 8));
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts))).toBeNull();
  });

  it('returns null when only 2 of the last 5 runs lack HR', () => {
    const acts = dates.map((d, i) => run(`r${i}`, d, 8, i < 3 ? 150 : undefined));
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts))).toBeNull();
  });

  it('ignores runs after today', () => {
    const acts = dates.map((d, i) => run(`r${i}`, d, 8));
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-10', acts))).toBeNull();
  });

  it('triggers with 3 of the last 5 runs without HR', () => {
    const acts = dates.map((d, i) => run(`r${i}`, d, 8, i === 1 || i === 3 ? 150 : undefined));
    const out = dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts))!;
    expect(out.id).toBe('data_quality_no_hr:2026-W43');
    expect(out.date).toBe('2026-10-20');
    expect(out.evidence[0].numeric).toBe(3);
    expect(out.evidence[1].numeric).toBe(1);
    expect(out.confidence).toBe(0.5);
  });

  it('reports the streak since the last run with HR and picks the text by level', () => {
    const acts = [run('a', '2026-09-01', 8, 150), ...dates.map((d, i) => run(`r${i}`, d, 8))];
    const regular = dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts))!;
    expect(regular.evidence[1]).toMatchObject({ numeric: 5, value: '5 depuis le 1er septembre 2026' });
    expect(regular.message).toBe(regular.athleteText);
    const beginner = dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts, { profile: { level: 'beginner' } }))!;
    expect(beginner.message).toBe(beginner.beginnerText);
  });
});
