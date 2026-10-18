import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { MacroBar } from '@/components/ui/MacroBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { clampRatio, formatKcal } from '@/lib/format';
import type { Macros } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type NutritionWidgetProps = {
  consumed: Macros;
  target: Macros;
  remaining: number;
};

export function NutritionWidget({ consumed, target, remaining }: NutritionWidgetProps) {
  const { colors } = useTheme();

  return (
    <View className="mt-10 items-center">
      <ProgressRing
        size={232}
        strokeWidth={10}
        progress={clampRatio(consumed.calories, target.calories)}
        color={colors.accent}
        trackColor={colors.track}>
        <Text className="text-6xl font-semibold tracking-tighter text-fg">
          {formatKcal(Math.abs(remaining))}
        </Text>
        <Label className="mt-1">{remaining >= 0 ? 'kcal restantes' : 'kcal en trop'}</Label>
      </ProgressRing>

      <View className="mt-10 w-full flex-row gap-6">
        <MacroBar label="Prot." value={consumed.protein} target={target.protein} accentClass="bg-accent" />
        <MacroBar label="Gluc." value={consumed.carbs} target={target.carbs} accentClass="bg-aqua" />
        <MacroBar label="Lip." value={consumed.fat} target={target.fat} accentClass="bg-iris" />
      </View>
    </View>
  );
}
