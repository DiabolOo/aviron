import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CARD_TINT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

export type CardTint = keyof typeof CARD_TINT;

type CardHaloProps = { tint: CardTint; radius?: number; opacity?: number };

export function CardHalo({ tint, radius = 28, opacity = 0.16 }: CardHaloProps) {
  const { scheme } = useTheme();
  if (scheme === 'dark') return null;
  const id = `halo-${tint}`;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 overflow-hidden"
      style={{ borderRadius: radius }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="100%" cy="0%" rx="130%" ry="90%" fx="100%" fy="0%">
            <Stop offset="0" stopColor={CARD_TINT[tint]} stopOpacity={opacity} />
            <Stop offset="0.58" stopColor={CARD_TINT[tint]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
