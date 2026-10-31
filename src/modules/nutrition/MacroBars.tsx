import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Macros } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

const ROWS = [
  { key: 'protein', label: 'Protéines' },
  { key: 'carbs', label: 'Glucides' },
  { key: 'fat', label: 'Lipides' },
] as const;

export function MacroBars({ target }: { target: Macros }) {
  const { colors } = useTheme();
  const total = target.protein + target.carbs + target.fat || 1;

  return (
    <View className="flex-row gap-3.5">
      {ROWS.map(({ key, label }) => (
        <View key={key} className="flex-1 gap-1.5">
          <Text className="text-[14px] text-muted">{label}</Text>
          <Text className="text-[20px] font-bold text-fg">{Math.round(target[key])} g</Text>
          <View className="h-1.5 rounded-sm" style={{ backgroundColor: colors.track }}>
            <View
              className="h-full rounded-sm"
              style={{
                width: `${Math.round((target[key] / total) * 100)}%`,
                backgroundColor: colors.nutri,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
