import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import type { ColorScheme, Theme } from './theme';
import { useTheme } from './useTheme';

type NamedStyles<S> = { [K in keyof S]: ViewStyle | TextStyle | ImageStyle };

/**
 * Feuille de styles dérivée des tokens, créée une fois par schéma de couleurs.
 *
 *   const useStyles = makeStyles((t) => ({ card: { padding: t.space.screen } }));
 *   const styles = useStyles();
 */
export function makeStyles<S extends NamedStyles<S>>(factory: (theme: Theme) => S) {
  const cache: Partial<Record<ColorScheme, Readonly<S>>> = {};
  return function useStyles(): Readonly<S> {
    const theme = useTheme();
    return (cache[theme.scheme] ??= StyleSheet.create(factory(theme)));
  };
}
