import { ctxOf, run } from '../testUtils';
import { gapResume } from './gapResume';

const acts = [run('a', '2026-09-01', 8), run('b', '2026-09-05', 8), run('c', '2026-09-10', 8)];

describe('gap_resume', () => {
  it('returns null with fewer than 3 activities', () => {
    expect(gapResume.evaluate(ctxOf('2026-11-01', acts.slice(0, 2)))).toBeNull();
  });

  it('returns null below 14 days since the last activity', () => {
    expect(gapResume.evaluate(ctxOf('2026-09-23', acts))).toBeNull();
  });

  it('triggers at exactly 14 days', () => {
    const out = gapResume.evaluate(ctxOf('2026-09-24', acts))!;
    expect(out.id).toBe('gap_resume:2026-09-10');
    expect(out.source).toBe('recovery');
    expect(out.severity).toBe('info');
    expect(out.evidence[0].numeric).toBe(14);
    expect(out.evidence[1].numeric).toBe(3);
  });

  it('counts any sport and ignores activities after today', () => {
    const recent = [...acts, run('s', '2026-09-20', 0, undefined, { type: 'strength' })];
    expect(gapResume.evaluate(ctxOf('2026-09-30', recent))).toBeNull();
    const future = [...acts, run('f', '2026-10-30', 8)];
    expect(gapResume.evaluate(ctxOf('2026-09-24', future))!.evidence[0].numeric).toBe(14);
  });
});
