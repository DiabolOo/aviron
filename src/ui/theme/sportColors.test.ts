import { palettes } from '@/constants/theme';
import { sportTokens } from './sportColors';

function hsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const SPORTS = ['run', 'swim', 'ride', 'walk', 'strength'] as const;

describe('couleurs par sport', () => {
  it.each(['light', 'dark'] as const)('même luminosité entre sports (%s), tolérance 2 points', (scheme) => {
    const ls = SPORTS.map((t) => hsl(sportTokens(palettes[scheme], t).color).l);
    expect(Math.max(...ls) - Math.min(...ls)).toBeLessThanOrEqual(0.02);
  });

  it('plus lumineuses en sombre qu’en clair', () => {
    for (const t of SPORTS) {
      expect(hsl(sportTokens(palettes.dark, t).color).l).toBeGreaterThan(hsl(sportTokens(palettes.light, t).color).l);
    }
  });

  it('jamais d’orange ni de jaune vifs (réservés à la flamme) ; le sable reste désaturé', () => {
    for (const scheme of ['light', 'dark'] as const) {
      for (const t of SPORTS) {
        const { h, s } = hsl(sportTokens(palettes[scheme], t).color);
        if (h >= 15 && h <= 70) expect(s).toBeLessThan(0.4);
      }
    }
  });

  it('pastels : très clairs en clair, très sombres en sombre (fondu vers le neutre)', () => {
    for (const t of SPORTS) {
      expect(hsl(sportTokens(palettes.light, t).tint).l).toBeGreaterThanOrEqual(0.85);
      expect(hsl(sportTokens(palettes.dark, t).tint).l).toBeLessThanOrEqual(0.3);
    }
  });

  it('une teinte distincte par sport ; musculation et autres partagent la prune', () => {
    const colors = SPORTS.map((t) => sportTokens(palettes.light, t).color);
    expect(new Set(colors).size).toBe(5);
    expect(sportTokens(palettes.light, 'other')).toEqual(sportTokens(palettes.light, 'strength'));
  });
});
