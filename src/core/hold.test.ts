import { canUndo, holdProgress, isHoldComplete, releaseProgress, roundedRectPerimeter } from './hold';

describe('hold', () => {
  it('progresse linéairement et est bornée', () => {
    expect(holdProgress(0)).toBe(0);
    expect(holdProgress(650)).toBeCloseTo(0.5);
    expect(holdProgress(5000)).toBe(1);
    expect(holdProgress(-10)).toBe(0);
  });

  it('valide seulement à 100 %', () => {
    expect(isHoldComplete(0.99)).toBe(false);
    expect(isHoldComplete(1)).toBe(true);
  });

  it('recule vers 0 quand on relâche', () => {
    expect(releaseProgress(0.6, 0)).toBeCloseTo(0.6);
    expect(releaseProgress(0.6, 175)).toBeCloseTo(0.3);
    expect(releaseProgress(0.6, 400)).toBe(0);
  });

  it('annulation possible pendant 5 s', () => {
    expect(canUndo(1000, 5000)).toBe(true);
    expect(canUndo(1000, 6001)).toBe(false);
  });
});

describe('roundedRectPerimeter', () => {
  it('rectangle sans arrondi = périmètre classique', () => {
    expect(roundedRectPerimeter(100, 50, 0)).toBe(300);
  });
  it('cercle quand le rayon est la moitié', () => {
    expect(roundedRectPerimeter(100, 100, 50)).toBeCloseTo(2 * Math.PI * 50);
  });
});
