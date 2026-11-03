import { designFonts } from './fonts';
import {
  colors,
  fontFamily,
  fontScaleCaps,
  heroMinimumFontScale,
  makeTheme,
  textStyle,
  typography,
} from './theme';

describe('makeTheme', () => {
  it('expose les seuils et plafonds d’agrandissement du texte', () => {
    const theme = makeTheme('light');
    expect(theme.fontScaleCaps).toBe(fontScaleCaps);
    expect(theme.fontScaleBreakpoints.stack).toBe(1.3);
    expect(theme.heroMinimumFontScale).toBe(heroMinimumFontScale);
  });

  it('choisit la palette du schéma et partage le reste', () => {
    const light = makeTheme('light');
    const dark = makeTheme('dark');
    expect(light.colors).toBe(colors.light);
    expect(dark.colors).toBe(colors.dark);
    expect(dark.scheme).toBe('dark');
    expect(dark.space).toBe(light.space);
  });

  it('a les mêmes clés de couleur en clair et en sombre', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('plafonne le héros à 80 px (×1,25)', () => {
    expect(typography.hero.fontSize * typography.hero.maxFontSizeMultiplier).toBe(80);
  });
});

describe('textStyle', () => {
  it('passe par fontFamily selon la graisse (Android ignore fontWeight)', () => {
    expect(textStyle('title', 'bold')).toEqual({
      fontFamily: 'InterTight_700Bold',
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.64,
    });
    expect(textStyle('caption', 'regular').fontFamily).toBe('Inter_400Regular');
  });

  it('ajoute les chiffres tabulaires aux rôles qui en ont', () => {
    expect(textStyle('hero', 'semibold').fontVariant).toEqual(['tabular-nums']);
    expect(textStyle('title', 'bold')).not.toHaveProperty('fontVariant');
  });
});

describe('designFonts', () => {
  it('charge exactement les familles référencées par le thème', () => {
    const families = [...Object.values(fontFamily.text), ...Object.values(fontFamily.display)];
    expect(Object.keys(designFonts).sort()).toEqual(families.sort());
  });
});
