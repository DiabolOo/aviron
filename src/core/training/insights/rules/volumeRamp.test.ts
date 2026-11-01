import type { Activity } from '../../../schemas';
import { ctxOf, run } from '../testUtils';
import { volumeRamp } from './volumeRamp';

const TODAY = '2026-11-01';

/** 4 semaines de référence : 4 courses de 10 km (moyenne 10 km/sem) — du 2026-09-27 au 2026-10-25. */
const baseline: Activity[] = ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19'].map((d, i) => run(`b${i}`, d, 10, 140));
/** la semaine courante couvre du 2026-10-26 au 2026-11-01 */
const week = (kms: number[]) => kms.map((k, i) => run(`w${i}`, `2026-10-${27 + i}`, k, 140));

describe('volume_ramp', () => {
  it('returns null when the history does not cover 5 weeks', () => {
    const recent = [run('a', '2026-10-20', 10), run('b', '2026-10-22', 10), run('c', '2026-10-24', 10), run('d', '2026-10-25', 10), ...week([15])];
    expect(volumeRamp.evaluate(ctxOf(TODAY, recent))).toBeNull();
  });

  it('returns null with fewer than 4 runs in the baseline', () => {
    const acts = [run('old', '2026-09-20', 5), ...baseline.slice(0, 3), ...week([20])];
    expect(volumeRamp.evaluate(ctxOf(TODAY, acts))).toBeNull();
  });

  it('returns null under 10 km or at +30 % or less', () => {
    expect(volumeRamp.evaluate(ctxOf(TODAY, [...baseline, ...week([13])]))).toBeNull();
    const tiny = baseline.map((a) => ({ ...a, distanceKm: 2 }));
    expect(volumeRamp.evaluate(ctxOf(TODAY, [...tiny, ...week([6])]))).toBeNull();
  });

  it('triggers above +30 % with at least 10 km', () => {
    const out = volumeRamp.evaluate(ctxOf(TODAY, [...baseline, ...week([14])]))!;
    expect(out.id).toBe('volume_ramp:2026-W44');
    expect(out.severity).toBe('notice');
    expect(out.source).toBe('trend');
    expect(out.evidence.map((e) => e.numeric)).toEqual([14, 10, 40]);
    expect(out.athleteText).toContain('+40 %');
    expect(out.athleteText).toContain('autour de 11 km');
  });

  it('escalates to warning at +50 % and ignores future runs', () => {
    const out = volumeRamp.evaluate(ctxOf(TODAY, [...baseline, ...week([16]), run('f', '2026-11-03', 30)]))!;
    expect(out.severity).toBe('warning');
    expect(out.evidence[0].numeric).toBe(16);
  });
});
