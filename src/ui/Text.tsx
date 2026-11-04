import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { textStyle, typography, useFontScale, useDesignPreview, useTheme, type Palette, type TextRole } from '@/src/design';

/** Ce qui fixe la taille du texte appartient au rôle : le style ne peut que placer. */
type PlacementStyle = Omit<TextStyle, 'fontSize' | 'lineHeight' | 'fontFamily' | 'fontWeight' | 'letterSpacing'>;

export type TextProps<R extends TextRole> = Omit<RNTextProps, 'role' | 'style' | 'maxFontSizeMultiplier' | 'allowFontScaling'> & {
  role: R;
  /** Graisse permise par le rôle (400, 600 ou 700) ; par défaut la première. */
  weight?: (typeof typography)[R]['weights'][number];
  color?: keyof Palette;
  /** Plafond d'usage plus strict que celui du rôle (`fontScaleCaps`). */
  cap?: number;
  style?: StyleProp<PlacementStyle>;
  children?: ReactNode;
};

/** Primitive de texte v3.1 : un rôle de `typography`, aucune taille libre. */
export function Text<R extends TextRole>({ role, weight, color = 'ink', cap, style, ...rest }: TextProps<R>) {
  const { colors } = useTheme();
  const forcedScale = useDesignPreview().fontScale;
  const scale = useFontScale();
  const roleCap = typography[role].maxFontSizeMultiplier;
  const max = Math.min(cap ?? Infinity, roleCap ?? Infinity);
  const base = textStyle(role, weight ?? (typography[role].weights[0] as (typeof typography)[R]['weights'][number]));
  const factor = Math.min(scale, max);
  const forced =
    forcedScale !== undefined
      ? { fontSize: base.fontSize * factor, lineHeight: base.lineHeight * factor, letterSpacing: base.letterSpacing * factor }
      : null;

  return (
    <RNText
      {...rest}
      allowFontScaling={forcedScale === undefined}
      maxFontSizeMultiplier={Number.isFinite(max) ? max : undefined}
      style={[base, forced, { color: colors[color] }, style]}
    />
  );
}
