import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { QuickAddSheet } from '@/components/dashboard/QuickAddSheet';
import { Card } from '@/components/ui/Card';
import { Gradient } from '@/components/ui/Gradient';
import { Text } from '@/components/ui/Text';
import { formatKcal } from '@/src/core/format';
import { staggerDelay } from '@/src/core/motion';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { CountUp } from '@/src/ui/motion/CountUp';
import { NUTRI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type NutritionWidgetProps = {
  remaining: number;
  series: { ratio: number; isToday: boolean }[];
};

function Column({ ratio, today, index }: { ratio: number; today: boolean; index: number }) {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const grow = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      grow.set(
        withDelay(
          400 + staggerDelay(index, 60),
          withTiming(1, { duration: 900, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        ),
      );
    }
  }, [grow, index, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: grow.get() }] }));
  const height = `${Math.max(8, Math.round(ratio * 100))}%` as const;

  return (
    <Animated.View
      className="flex-1 justify-end"
      style={[{ height: '100%', transformOrigin: 'bottom' }, style]}>
      {today ? (
        <Gradient colors={NUTRI_GRADIENT} vertical style={{ height, borderRadius: 4 }} />
      ) : (
        <View style={{ height, borderRadius: 4, backgroundColor: colors.track }} />
      )}
    </Animated.View>
  );
}

export function NutritionWidget({ remaining, series }: NutritionWidgetProps) {
  const { colors } = useTheme();
  const [adding, setAdding] = useState(false);

  return (
    <Card tint="nutri" className="flex-1 p-[18px]">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-[17px] font-semibold text-fg">Nutrition</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un repas"
          hitSlop={5}
          onPress={() => setAdding(true)}
          className="h-[34px] w-[34px] items-center justify-center rounded-full bg-chip active:scale-95">
          <Plus color={colors.fg} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>
      <CountUp
        value={Math.abs(remaining)}
        format={formatKcal}
        className="text-[40px] font-bold leading-[44px] tracking-tight text-fg"
      />
      <Text className="text-[15px] text-muted">{remaining >= 0 ? 'kcal restantes' : 'kcal en trop'}</Text>
      <View accessibilityElementsHidden className="mt-3 h-12 flex-row items-end gap-[5px]">
        {series.map((point, i) => (
          <Column key={i} ratio={point.ratio} today={point.isToday} index={i} />
        ))}
      </View>
      <QuickAddSheet visible={adding} onClose={() => setAdding(false)} />
    </Card>
  );
}
