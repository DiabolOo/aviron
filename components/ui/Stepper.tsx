import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type StepperProps = {
  value: number;
  step: number;
  min: number;
  max: number;
  unit: string;
  decimals?: number;
  onChange: (value: number) => void;
};

export function Stepper({ value, step, min, max, unit, decimals = 0, onChange }: StepperProps) {
  const { colors } = useTheme();

  const update = (delta: number) => {
    const next = Math.min(max, Math.max(min, Number((value + delta).toFixed(decimals))));
    if (next === value) return;
    void Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        accessibilityLabel="Diminuer"
        onPress={() => update(-step)}
        className="h-8 w-8 items-center justify-center rounded-full bg-fg/5 active:opacity-60">
        <Minus color={colors.fg} size={14} strokeWidth={2} />
      </Pressable>
      <Text className="min-w-[76px] text-center text-base font-semibold text-fg">
        {value.toFixed(decimals)}
        <Text className="text-xs font-normal text-muted"> {unit}</Text>
      </Text>
      <Pressable
        accessibilityLabel="Augmenter"
        onPress={() => update(step)}
        className="h-8 w-8 items-center justify-center rounded-full bg-fg/5 active:opacity-60">
        <Plus color={colors.fg} size={14} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
