import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
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
  const router = useRouter();
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

      {consumed.calories === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scanner ou ajouter un repas"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.navigate('/nutrition');
          }}
          className="mt-6 flex-row items-center gap-1.5 active:opacity-70">
          <Text className="text-sm text-muted">Scanne ou ajoute ton premier repas</Text>
          <ChevronRight color={colors.muted} size={14} strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </View>
  );
}
