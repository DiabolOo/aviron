import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { Gradient } from '@/components/ui/Gradient';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { staggerDelay } from '@/src/core/motion';
import { PERIOD_COMPARE, buildSportStats } from '@/src/core/stats';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useStatsPeriod } from '@/src/ui/stats/period';
import { useTheme } from '@/src/ui/useTheme';

function Bar({ ratio, label, current, index }: { ratio: number; label: string; current: boolean; index: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      grow.set(
        withDelay(
          staggerDelay(index),
          withTiming(1, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        ),
      );
    }
  }, [grow, index, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: grow.get() }] }));

  return (
    <View className="h-full flex-1 items-center justify-end gap-1.5">
      <Animated.View
        className="w-full"
        style={[{ height: `${Math.round(ratio * 100)}%`, transformOrigin: 'bottom' }, style]}>
        {current ? (
          <Gradient colors={['#8E86FF', '#4F46E5']} vertical style={{ flex: 1, borderRadius: 6 }} />
        ) : (
          <View className="flex-1 rounded-md" style={{ backgroundColor: colors.track }} />
        )}
      </Animated.View>
      <Text className="text-[13px] text-muted">{label}</Text>
    </View>
  );
}

export function SportStats() {
  const period = useStatsPeriod((s) => s.period);
  const activities = usePulseFitStore((s) => s.activities);
  const stats = buildSportStats({ period, today: toISODate(new Date()), activities });
  const positive = (stats.deltaPct ?? 0) >= 0;

  return (
    <Card tint="sport" className="gap-2.5 p-[18px]">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[17px] font-semibold text-fg">Sport</Text>
        {stats.deltaPct !== null ? (
          <Text className={`text-[14px] font-semibold ${positive ? 'text-aqua' : 'text-muted'}`}>
            {positive ? '+' : ''}
            {stats.deltaPct} % {PERIOD_COMPARE[period]}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[36px] font-bold leading-10 tracking-tight text-fg">
          {String(stats.km).replace('.', ',')}
        </Text>
        <Text className="text-[16px] text-muted">
          km · {stats.sessions} {stats.sessions > 1 ? 'séances' : 'séance'}
        </Text>
      </View>
      <View className="h-[84px] flex-row gap-2.5" accessibilityElementsHidden>
        {stats.bars.map((bar, i) => (
          <Bar key={`${bar.label}-${i}`} index={i} {...bar} />
        ))}
      </View>
    </Card>
  );
}
