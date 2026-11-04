import { useColorScheme } from 'react-native';

import { useDesignPreview } from './preview';
import { makeTheme, type ColorScheme, type Theme } from './theme';

const themes: Record<ColorScheme, Theme> = {
  light: makeTheme('light'),
  dark: makeTheme('dark'),
};

/**
 * Thème actif, clair ou sombre selon le réglage système (et la préférence de l'app, que
 * `colorScheme.set` répercute sur `Appearance`), sauf schéma forcé par `DesignPreviewProvider`.
 * Référence stable par schéma.
 */
export function useTheme(): Theme {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  return themes[useDesignPreview().scheme ?? system];
}
