import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { smoothPath } from '@/components/sport/SmoothPath';
import type { RoutePoint } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

const WIDTH = 320;
const HEIGHT = 220;
const PAD = 28;

export function RouteMap({ polyline }: { polyline: RoutePoint[] }) {
  const { colors } = useTheme();
  const points = polyline.map((pt) => ({
    x: PAD + pt.x * (WIDTH - PAD * 2),
    y: PAD + pt.y * (HEIGHT - PAD * 2),
  }));
  const d = smoothPath(points);
  const start = points[0];
  const end = points[points.length - 1];
  const grid = [1, 2, 3, 4, 5];

  return (
    <View className="mt-3 overflow-hidden rounded-3xl border border-fg/5 bg-surface">
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.aqua} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        {grid.map((i) => (
          <Line
            key={`h${i}`}
            x1={0}
            x2={WIDTH}
            y1={(HEIGHT / 6) * i}
            y2={(HEIGHT / 6) * i}
            stroke={colors.fg}
            strokeOpacity={0.05}
          />
        ))}
        {grid.map((i) => (
          <Line
            key={`v${i}`}
            y1={0}
            y2={HEIGHT}
            x1={(WIDTH / 6) * i}
            x2={(WIDTH / 6) * i}
            stroke={colors.fg}
            strokeOpacity={0.05}
          />
        ))}
        <Path d={d} stroke={colors.accent} strokeOpacity={0.15} strokeWidth={9} fill="none" strokeLinecap="round" />
        <Path d={d} stroke="url(#route)" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={start.x} cy={start.y} r={5} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
        <Circle cx={end.x} cy={end.y} r={5} fill={colors.fg} stroke={colors.surface} strokeWidth={2} />
      </Svg>
    </View>
  );
}
