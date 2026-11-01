import { ctxOf, run } from '../testUtils';
import { gapResume } from './gapResume';

/** séances de 60 min (durée habituelle) */
const acts = [
  run('a', '2026-09-01', 11, undefined, { durationMin: 60 }),
  run('b', '2026-09-05', 11, undefined, { durationMin: 60 }),
  run('c', '2026-09-10', 11, undefined, { durationMin: 60 }),
];

describe('gap_resume', () => {
  it('returns null with fewer than 3 activities', () => {
    expect(gapResume.evaluate(ctxOf('2026-11-01', acts.slice(0, 2)))).toBeNull();
  });

  it('returns null below 14 days since the last activity', () => {
    expect(gapResume.evaluate(ctxOf('2026-09-23', acts))).toBeNull();
  });

  it('resumes at 70 % of the usual session for a 14 to 27 day break', () => {
    const out = gapResume.evaluate(ctxOf('2026-09-24', acts))!;
    expect(out.id).toBe('gap_resume:2026-09-10');
    expect(out.source).toBe('recovery');
    expect(out.severity).toBe('info');
    expect(out.evidence.map((e) => e.numeric)).toEqual([14, 3, 60, 42]);
    expect(out.athleteText).toContain('Reprends par 42 min à allure facile (70 % de ta séance habituelle, 60 min)');
    expect(out.beginnerText).toContain('environ 42 minutes');
    expect(gapResume.evaluate(ctxOf('2026-10-07', acts))!.evidence[0].numeric).toBe(27);
    expect(gapResume.evaluate(ctxOf('2026-10-07', acts))!.athleteText).toContain('42 min');
  });

  it('resumes with 20 minutes from 28 days of break', () => {
    const out = gapResume.evaluate(ctxOf('2026-10-08', acts))!;
    expect(out.evidence.map((e) => e.numeric)).toEqual([28, 3, 20]);
    expect(out.athleteText).toMatch(/Reprends par 20 min à allure facile\.$/);
    expect(out.beginnerText).toContain('de 20 minutes');
  });

  it('mentions injury or illness and a professional in the why', () => {
    const out = gapResume.evaluate(ctxOf('2026-09-24', acts))!;
    expect(out.why).toMatch(/blessure/);
    expect(out.why).toMatch(/maladie/);
    expect(out.why).toMatch(/professionnel/);
  });

  it('uses the median duration of the same sport and ignores activities after today', () => {
    const mixed = [...acts, run('s', '2026-09-10', 0, undefined, { type: 'strength', durationMin: 20, startTime: '07:00' }), run('f', '2026-10-30', 8)];
    const out = gapResume.evaluate(ctxOf('2026-09-24', mixed))!;
    expect(out.evidence[0].numeric).toBe(14);
    expect(out.evidence[2].numeric).toBe(60);
  });

  it('counts any sport for the last activity', () => {
    const recent = [...acts, run('s', '2026-09-20', 0, undefined, { type: 'strength' })];
    expect(gapResume.evaluate(ctxOf('2026-09-30', recent))).toBeNull();
  });
});
