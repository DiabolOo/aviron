import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { clampRatio, formatKcal } from '@/lib/format';
import { useTheme } from '@/lib/useTheme';

type CalorieGaugeProps = {
  consumed: number;
  burned: number;
  target: number;
  remaining: number;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-semibold tracking-tight text-fg">{value}</Text>
      <Label className="mt-1">{label}</Label>
    </View>
  );
}

export function CalorieGauge({ consumed, burned, target, remaining }: CalorieGaugeProps) {
  const { colors } = useTheme();

  return (
    <View className="mt-8 items-center">
      <ProgressRing
        size={232}
        strokeWidth={10}
        progress={clampRatio(consumed, target + burned)}
        color={colors.accent}
        trackColor={colors.track}>
        <Text className="text-6xl font-semibold tracking-tighter text-fg">
          {formatKcal(Math.abs(remaining))}
        </Text>
        <Label className="mt-1">{remaining >= 0 ? 'kcal restantes' : 'kcal en trop'}</Label>
      </ProgressRing>

      <View className="mt-8 w-full flex-row">
        <Stat label="Mangées" value={formatKcal(consumed)} />
        <View className="w-px bg-fg/10" />
        <Stat label="Brûlées" value={formatKcal(burned)} />
        <View className="w-px bg-fg/10" />
        <Stat label="Objectif" value={formatKcal(target)} />
      </View>
    </View>
  );
}
