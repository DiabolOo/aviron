import { Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { smoothPath } from '@/components/sport/SmoothPath';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/useTheme';

const WIDTH = 320;
const HEIGHT = 140;
const PAD_Y = 12;
const HR_COLOR = '#FF4D5E';

type HeartRateChartProps = {
  stream: number[];
  avgHr: number;
  maxHr: number;
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <Text className="font-mono text-[10px] uppercase tracking-[2px] text-muted">{label}</Text>
      <Text className="mt-1 text-4xl font-semibold tracking-tighter text-fg">
        {value}
        <Text className="text-sm font-normal text-muted"> bpm</Text>
      </Text>
    </View>
  );
}

export function HeartRateChart({ stream, avgHr, maxHr }: HeartRateChartProps) {
  const { colors } = useTheme();
  const min = Math.min(...stream) - 5;
  const max = Math.max(...stream) + 5;
  const toY = (hr: number) => PAD_Y + (1 - (hr - min) / (max - min)) * (HEIGHT - PAD_Y * 2);
  const points = stream.map((hr, i) => ({ x: (i / (stream.length - 1)) * WIDTH, y: toY(hr) }));
  const line = smoothPath(points);
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const avgY = toY(avgHr);

  return (
    <Card className="mt-3">
      <View className="flex-row gap-10">
        <Stat label="FC max" value={maxHr} />
        <Stat label="FC moy." value={avgHr} />
      </View>
      <View className="mt-5">
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={HR_COLOR} stopOpacity={0.35} />
              <Stop offset="1" stopColor={HR_COLOR} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="hrLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.accent} />
              <Stop offset="1" stopColor={HR_COLOR} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#hrFill)" />
          <Line
            x1={0}
            x2={WIDTH}
            y1={avgY}
            y2={avgY}
            stroke={colors.fg}
            strokeOpacity={0.25}
            strokeDasharray="4 4"
          />
          <Path d={line} stroke="url(#hrLine)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </Svg>
      </View>
    </Card>
  );
}
