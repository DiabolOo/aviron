import { computeReadiness } from './readiness';

describe('computeReadiness', () => {
  it('les poids totalisent 1', () => {
    const { factors } = computeReadiness({ sleepHours: 8, restingHrDelta: 0, loadRatio: 1 });
    expect(factors.reduce((s, f) => s + f.weight, 0)).toBeCloseTo(1);
  });

  it('score maximal avec de bons indicateurs', () => {
    expect(computeReadiness({ sleepHours: 8, restingHrDelta: -2, loadRatio: 1 })).toMatchObject({
      score: 100,
      label: 'Optimale',
    });
  });

  it('baisse quand le sommeil et la charge se dégradent', () => {
    const r = computeReadiness({ sleepHours: 4, restingHrDelta: 8, loadRatio: 1.5 });
    expect(r.score).toBeLessThan(40);
    expect(r.label).toBe('À ménager');
  });
});
