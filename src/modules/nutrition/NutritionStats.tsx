import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { formatKcal } from '@/src/core/format';
import { buildNutritionStats } from '@/src/core/stats';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useStatsPeriod } from '@/src/ui/stats/period';
import { useTheme } from '@/src/ui/useTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const H = 64;

function Curve({ points, target }: { points: number[]; target: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const draw = useSharedValue(reduced ? 1 : 0);
  const max = Math.max(target * 1.15, ...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const y = (v: number) => H - 4 - (v / max) * (H - 8);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const length = Math.max(1, width * 1.6);

  useEffect(() => {
    if (!reduced) draw.set(withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [draw, reduced]);

  const animated = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.get()) }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
      {width > 0 ? (
        <Svg width={width} height={H}>
          <Line
            x1={0}
            x2={width}
            y1={y(target)}
            y2={y(target)}
            stroke={colors.muted}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <AnimatedPath
            d={d}
            fill="none"
            stroke={colors.nutri}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${length} ${length}`}
            animatedProps={animated}
          />
        </Svg>
      ) : null}
    </View>
  );
}

export function NutritionStats() {
  const period = useStatsPeriod((s) => s.period);
  const meals = usePulseFitStore((s) => s.meals);
  const target = usePulseFitStore((s) => s.profile.macrosTarget.calories);
  const stats = buildNutritionStats({
    period,
    today: toISODate(new Date()),
    meals,
    targetKcal: target,
  });

  return (
    <Card tint="nutri" className="gap-2.5 p-[18px]">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[17px] font-semibold text-fg">Nutrition</Text>
        <Text className="text-[14px] text-muted">Cible {formatKcal(stats.targetKcal)} kcal</Text>
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[36px] font-bold leading-10 tracking-tight text-fg">
          {formatKcal(stats.avgKcal)}
        </Text>
        <Text className="text-[16px] text-muted">kcal par jour</Text>
      </View>
      <Curve key={period} points={stats.points} target={stats.targetKcal} />
    </Card>
  );
}
