import { ctxOf, run } from '../testUtils';
import { dataQualityNoHr } from './dataQualityNoHr';

const dates = ['2026-10-01', '2026-10-04', '2026-10-08', '2026-10-12', '2026-10-15'];
/** 5 séances avec FC en septembre : l'historique prouve que la mesure a existé */
const base = ['2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08', '2026-09-10'].map((d, i) => run(`hr${i}`, d, 8, 150));
const lastHr = '2026-09-10';
const noHrRuns = () => dates.map((d, i) => run(`r${i}`, d, 8));

describe('data_quality_no_hr', () => {
  it('returns null with fewer than 5 runs', () => {
    const rides = base.map((a) => ({ ...a, type: 'ride' as const }));
    const acts = [...rides, ...noHrRuns().slice(0, 4)];
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', acts))).toBeNull();
  });

  it('returns null when only 2 of the last 5 runs lack HR', () => {
    const acts = noHrRuns().map((a, i) => ({ ...a, avgHr: i < 3 ? 150 : undefined }));
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...acts]))).toBeNull();
  });

  it('returns null for a beginner, even with enough sessions with HR', () => {
    const ctx = ctxOf('2026-10-20', [...base, ...noHrRuns()], { profile: { level: 'beginner' } });
    expect(dataQualityNoHr.evaluate(ctx)).toBeNull();
  });

  it('returns null for a beginner with a single session with HR', () => {
    const ctx = ctxOf('2026-10-20', [run('hr', '2026-09-10', 8, 150), ...noHrRuns()], { profile: { level: 'beginner' } });
    expect(dataQualityNoHr.evaluate(ctx)).toBeNull();
  });

  it('returns null when the athlete has no HR device', () => {
    const ctx = ctxOf('2026-10-20', [...base, ...noHrRuns()], { profile: { hasHrDevice: false } });
    expect(dataQualityNoHr.evaluate(ctx)).toBeNull();
    const withDevice = ctxOf('2026-10-20', [...base, ...noHrRuns()], { profile: { hasHrDevice: true } });
    expect(dataQualityNoHr.evaluate(withDevice)).not.toBeNull();
  });

  it('requires at least 5 sessions with HR in the history', () => {
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base.slice(0, 4), ...noHrRuns()]))).toBeNull();
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', noHrRuns()))).toBeNull();
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...noHrRuns()]))).not.toBeNull();
  });

  it('ignores runs and sessions after today', () => {
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-03', [...base, ...noHrRuns()]))).toBeNull();
    const futureHr = base.map((a, i) => ({ ...a, id: `f${i}`, date: `2026-11-0${i + 1}` }));
    expect(dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base.slice(0, 4), ...futureHr, ...noHrRuns()]))).toBeNull();
  });

  it('triggers for an experienced runner with 11 runs without HR', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => run(`n${i}`, `2026-09-${String(12 + i).padStart(2, '0')}`, 9));
    const out = dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...eleven], { profile: { level: 'advanced' } }))!;
    expect(out.id).toBe(`data_quality_no_hr:${lastHr}`);
    expect(out.evidence[1]).toMatchObject({ numeric: 11, value: '11 depuis le 10 septembre 2026' });
    expect(out.athleteText).toBe(
      '11 courses sans FC depuis le 10 septembre 2026. Active l’enregistrement sur ta montre ou ton capteur cardiaque.',
    );
    expect(out.message).toBe(out.athleteText);
  });

  it('triggers with 3 of the last 5 runs without HR', () => {
    const acts = noHrRuns().map((a, i) => ({ ...a, avgHr: i === 1 || i === 3 ? 150 : undefined }));
    const out = dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...acts]))!;
    expect(out.id).toBe('data_quality_no_hr:2026-10-12');
    expect(out.source).toBe('trend');
    expect(out.date).toBe('2026-10-20');
    expect(out.evidence[0].numeric).toBe(3);
    expect(out.evidence[1].numeric).toBe(1);
    expect(out.athleteText).toContain('3 de tes 5 dernières courses sont sans FC');
    expect(out.confidence).toBe(0.5);
  });

  it('uses « montre ou capteur cardiaque » and a neutral wording', () => {
    const out = dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...noHrRuns()]))!;
    for (const t of [out.beginnerText, out.athleteText]) expect(t).toContain('montre ou ton capteur cardiaque');
    for (const t of [out.beginnerText, out.athleteText, out.why]) expect(t).not.toMatch(/\bje\b|\bj’/i);
  });

  it('counts any sport as a session with HR for the period key', () => {
    const ride = run('ride', '2026-10-18', 20, 130, { type: 'ride' });
    const out = dataQualityNoHr.evaluate(ctxOf('2026-10-20', [...base, ...noHrRuns(), ride]))!;
    expect(out.id).toBe('data_quality_no_hr:2026-10-18');
  });
});
