import { StyleSheet } from 'react-native';

import type { ColorScheme, Theme } from './theme';
import { useTheme } from './useTheme';

/**
 * Feuille de styles dérivée des tokens, créée une fois par schéma de couleurs.
 *
 *   const useStyles = makeStyles((t) => ({ card: { padding: t.space.screen } }));
 *   const styles = useStyles();
 */
export function makeStyles<S extends StyleSheet.NamedStyles<S>>(factory: (theme: Theme) => S) {
  const cache: Partial<Record<ColorScheme, S>> = {};
  return function useStyles(): S {
    const theme = useTheme();
    return (cache[theme.scheme] ??= StyleSheet.create(factory(theme)));
  };
}
