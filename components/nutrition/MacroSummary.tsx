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
import { clampRatio, formatKcal } from '@/src/core/format';
import type { Macros } from '@/src/core/types';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { NUTRI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type MacroSummaryProps = {
  consumed: Macros;
  target: Macros;
};

function Bar({ ratio, height, delay = 400 }: { ratio: number; height: number; delay?: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      grow.set(withDelay(delay, withTiming(1, { duration: 1000, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })));
    }
  }, [delay, grow, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.get() }] }));

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.track }}>
      <Animated.View
        style={[{ width: `${Math.round(ratio * 100)}%`, height, transformOrigin: 'left' }, style]}>
        <Gradient
          colors={NUTRI_GRADIENT}
          horizontal
          style={{ flex: 1, borderRadius: height / 2 }}
        />
      </Animated.View>
    </View>
  );
}

const MACROS = [
  { key: 'protein', label: 'Prot.' },
  { key: 'carbs', label: 'Gluc.' },
  { key: 'fat', label: 'Lip.' },
] as const;

export function MacroSummary({ consumed, target }: MacroSummaryProps) {
  return (
    <Card tint="nutri" className="gap-3.5">
      <View className="flex-row items-baseline gap-2">
        <Text className="text-[40px] font-bold leading-[44px] tracking-tight text-fg">
          {formatKcal(consumed.calories)}
        </Text>
        <Text className="text-[17px] text-muted">/ {formatKcal(target.calories)} kcal</Text>
      </View>
      <Bar ratio={clampRatio(consumed.calories, target.calories)} height={8} />
      <View className="flex-row gap-4">
        {MACROS.map(({ key, label }, i) => (
          <View key={key} className="flex-1 items-center">
            <Text className="text-[14px] text-muted">{label}</Text>
            <Text className="mt-0.5 text-[19px] font-semibold text-fg">{Math.round(consumed[key])}</Text>
            <Text className="text-[13px] text-muted">/ {Math.round(target[key])} g</Text>
            <View className="mt-2 w-full">
              <Bar ratio={clampRatio(consumed[key], target[key])} height={5} delay={500 + i * 60} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
