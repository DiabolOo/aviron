import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AURORA, DARK_GLOW, type Tone } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

export function Glow({ tone = 'home' }: { tone?: Tone }) {
  const { scheme } = useTheme();
  const blobs =
    scheme === 'dark' ? [{ color: DARK_GLOW, cx: 50, cy: 0 }] : AURORA[tone];

  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[460px]">
      <Svg width="100%" height="100%">
        <Defs>
          {blobs.map((b, i) => (
            <RadialGradient
              key={i}
              id={`aurora-${i}`}
              cx={`${b.cx}%`}
              cy={`${b.cy}%`}
              rx="75%"
              ry="55%"
              fx={`${b.cx}%`}
              fy={`${b.cy}%`}>
              <Stop offset="0" stopColor={b.color} stopOpacity={1} />
              <Stop offset="0.62" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {blobs.map((_, i) => (
          <Rect key={i} width="100%" height="100%" fill={`url(#aurora-${i})`} />
        ))}
      </Svg>
    </View>
  );
}
