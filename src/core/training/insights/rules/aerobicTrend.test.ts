import type { Activity } from '../../../schemas';
import { ctxOf, run } from '../testUtils';
import { aerobicTrend } from './aerobicTrend';

const TODAY = '2026-11-01';

/** 3 sorties de 8 km avec FC 150 à `paceMinPerKm` dans le trimestre dont `dates` sont les jours */
const quarter = (prefix: string, dates: string[], paceMinPerKm: number): Activity[] =>
  dates.map((d, i) => run(`${prefix}${i}`, d, 8, 150, { durationMin: 8 * paceMinPerKm }));

const q3 = (pace: number) => quarter('q3-', ['2026-07-10', '2026-08-10', '2026-09-10'], pace);
const q4 = (pace: number) => quarter('q4-', ['2026-10-10', '2026-10-20', '2026-10-30'], pace);

describe('aerobic_trend', () => {
  it('returns null when a quarter is not reliable', () => {
    expect(aerobicTrend.evaluate(ctxOf(TODAY, [...q3(6), ...q4(5).slice(0, 2)]))).toBeNull();
    const noHr = q4(5).map((a) => ({ ...a, avgHr: undefined }));
    expect(aerobicTrend.evaluate(ctxOf(TODAY, [...q3(6), ...noHr]))).toBeNull();
  });

  it('returns null without the previous quarter', () => {
    expect(aerobicTrend.evaluate(ctxOf(TODAY, q4(5)))).toBeNull();
  });

  it('returns null under a 5 % variation', () => {
    expect(aerobicTrend.evaluate(ctxOf(TODAY, [...q3(5.2), ...q4(5)]))).toBeNull();
  });

  it('reports an improvement as info', () => {
    const out = aerobicTrend.evaluate(ctxOf(TODAY, [...q3(5.5), ...q4(5)]))!;
    expect(out.id).toBe('aerobic_trend:2026-Q4');
    expect(out.severity).toBe('info');
    expect(out.evidence[2].numeric).toBe(10);
    expect(out.athleteText).toContain('À FC égale, tu cours 10,0 % plus vite');
    expect(out.athleteText).toContain('T4 2026 vs T3 2026');
  });

  it('reports a decline as notice', () => {
    const out = aerobicTrend.evaluate(ctxOf(TODAY, [...q3(5), ...q4(5.5)]))!;
    expect(out.severity).toBe('info');
    expect(out.evidence[2].numeric).toBeLessThan(0);
    expect(out.athleteText).toContain('moins vite');
    expect(out.athleteText).toContain('Plusieurs causes possibles (chaleur, fatigue, parcours)');
    expect(out.message).not.toMatch(/Ajoute|Fais|Garde|Reprends/);
    expect(out.title).toContain('moins vite');
  });

  it('falls back on the previous quarter when the current one is not reliable', () => {
    const q4Short = q4(5).slice(0, 1);
    const out = aerobicTrend.evaluate(ctxOf(TODAY, [...quarter('q2-', ['2026-04-10', '2026-05-10', '2026-06-10'], 6), ...q3(5), ...q4Short]))!;
    expect(out.id).toBe('aerobic_trend:2026-Q3');
  });
});
