import { useColorScheme } from 'react-native';

import { makeTheme, type ColorScheme, type Theme } from './theme';

const themes: Record<ColorScheme, Theme> = {
  light: makeTheme('light'),
  dark: makeTheme('dark'),
};

/**
 * Thème actif, clair ou sombre selon le réglage système (et la préférence de l'app, que
 * `colorScheme.set` répercute sur `Appearance`). Référence stable par schéma.
 */
export function useTheme(): Theme {
  return themes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
