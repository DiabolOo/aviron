import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/lib/useTheme';

export function Glow() {
  const { scheme, colors } = useTheme();

  return (
    <View pointerEvents="none" className="absolute inset-x-0 -top-24 h-[420px]">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="45%" rx="65%" ry="50%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={scheme === 'dark' ? 0.14 : 0.3} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}
