import { countValue, easeOutCubic, staggerDelay } from './motion';

describe('motion', () => {
  it('easeOutCubic borne entre 0 et 1', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('countValue part de 0 et finit exactement à la cible', () => {
    expect(countValue(850, 0)).toBe(0);
    expect(countValue(850, 1600)).toBe(850);
    expect(countValue(850, 5000)).toBe(850);
    expect(countValue(88, 800)).toBeGreaterThan(44);
  });

  it('staggerDelay décale de 70 ms par carte', () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(3)).toBe(210);
  });
});
