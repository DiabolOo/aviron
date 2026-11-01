import { ctxOf, run } from '../testUtils';
import { intensityTooHigh } from './intensityTooHigh';

const TODAY = '2026-11-01';
/** n courses de 8 km espacées de 3 jours, FC données (la plus récente en dernier) */
function runs(hrs: (number | undefined)[], km = 8, startOffset = 3) {
  return hrs.map((hr, i) => run(`r${i}`, `2026-10-${String(30 - (hrs.length - 1 - i) * startOffset).padStart(2, '0')}`, km, hr));
}

describe('intensity_too_high', () => {
  it('returns null with fewer than 4 eligible runs', () => {
    expect(intensityTooHigh.evaluate(ctxOf(TODAY, runs([170, 172, 175])))).toBeNull();
  });

  it('ignores runs without HR and runs of 5 km or less', () => {
    const acts = [...runs([170, 172, 175]), run('x', '2026-10-31', 8), run('y', '2026-10-31', 5, 180)];
    expect(intensityTooHigh.evaluate(ctxOf(TODAY, acts))).toBeNull();
  });

  it('ignores runs older than 12 weeks', () => {
    const old = [0, 1, 2, 3].map((i) => run(`o${i}`, `2026-07-${10 + i}`, 8, 175));
    expect(intensityTooHigh.evaluate(ctxOf(TODAY, old))).toBeNull();
  });

  it('returns null without any max HR source', () => {
    const ctx = ctxOf(TODAY, runs([170, 172, 175, 178]), { profile: { maxHr: undefined, ageYears: undefined } });
    expect(intensityTooHigh.evaluate(ctx)).toBeNull();
  });

  it('returns null below 40 % of hard runs', () => {
    expect(intensityTooHigh.evaluate(ctxOf(TODAY, runs([170, 150, 148, 145, 150])))).toBeNull();
  });

  it('triggers at 40 % with maxHr 200 (threshold 160, easy 150)', () => {
    const out = intensityTooHigh.evaluate(ctxOf(TODAY, runs([170, 175, 150, 148, 145])))!;
    expect(out.severity).toBe('notice');
    expect(out.evidence[0]).toMatchObject({ numeric: 40, value: '2 / 5 (40 %)' });
    expect(out.athleteText).toContain('160 bpm');
    expect(out.athleteText).toContain('sous 150 bpm');
    expect(out.confidence).toBe(5 / 8);
  });

  it('escalates to warning at 60 % and falls back on the Tanaka estimate with « environ »', () => {
    const ctx = ctxOf(TODAY, runs([160, 165, 170, 150, 148]), { profile: { maxHr: undefined, ageYears: 30 } });
    const out = intensityTooHigh.evaluate(ctx)!;
    expect(out.severity).toBe('warning');
    expect(out.evidence[1]).toMatchObject({ numeric: 187, label: 'FC max utilisée (estimée)' });
    expect(out.athleteText).toContain('dépassent environ 150 bpm');
    expect(out.athleteText).toContain('ta FC max estimée');
    expect(out.athleteText).toContain('sous environ 140 bpm');
  });

  it('takes max(observed, Tanaka) unless the max HR is configured', () => {
    const hrs = [170, 175, 150, 148, 145];
    const low = (source: 'observed' | 'configured' | 'estimated') =>
      intensityTooHigh.evaluate(ctxOf(TODAY, runs(hrs), { profile: { maxHr: 180, maxHrSource: source, ageYears: 20 } }))!;
    // Tanaka à 20 ans = 194
    expect(low('observed').evidence[1].numeric).toBe(194);
    expect(low('observed').athleteText).toContain('environ');
    expect(low('estimated').evidence[1].numeric).toBe(194);
    expect(low('configured').evidence[1].numeric).toBe(180);
    expect(low('configured').athleteText).not.toContain('environ');
    const high = intensityTooHigh.evaluate(ctxOf(TODAY, runs(hrs), { profile: { maxHr: 201, maxHrSource: 'observed', ageYears: 40 } }))!;
    expect(high.evidence[1].numeric).toBe(201);
    expect(high.athleteText).not.toContain('environ');
  });

  it('says « environ » when an estimated max HR is stored in the profile', () => {
    const ctx = ctxOf(TODAY, runs([170, 175, 150, 148, 145]), { profile: { maxHr: 180, maxHrSource: 'estimated', ageYears: 40 } });
    expect(intensityTooHigh.evaluate(ctx)!.athleteText).toContain('environ');
  });
});
