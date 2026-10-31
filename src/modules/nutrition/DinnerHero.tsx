import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { mealMomentForHour, toISODate } from '@/src/core/dates';
import { formatKcal } from '@/src/core/format';
import { suggestDinner } from '@/src/core/mealPlan';
import type { MealMoment } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

const MOMENT_TITLE: Record<MealMoment, string> = {
  morning: 'Ce matin · Petit-déj',
  noon: 'Ce midi · Déjeuner',
  snack: 'Cet après-midi · Collation',
  evening: 'Ce soir · Dîner',
};

export function DinnerHero() {
  const { colors } = useTheme();
  const sportEnabled = usePulseFitStore((s) => s.moduleFlags.sport ?? true);
  const { remaining } = useTodayStats();
  const addMeal = usePulseFitStore((s) => s.addMeal);
  const [idea, setIdea] = useState(0);

  if (sportEnabled) return null;

  const dish = suggestDinner(remaining, idea);
  const now = new Date();

  return (
    <Card tint="nutri" className="gap-3.5 p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[16px] font-medium text-muted">{MOMENT_TITLE[mealMomentForHour(now.getHours())]}</Text>
        <Text className="text-[14px] text-muted">Il te reste {formatKcal(Math.max(0, remaining))} kcal</Text>
      </View>
      <Text className="text-[26px] font-bold leading-[30px] tracking-tight text-fg">{dish.name}</Text>
      <Text className="text-[16px] text-muted">
        {dish.kcal} kcal · {dish.protein} g de protéines · {dish.minutes} min
      </Text>
      <View className="flex-row gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Autre idée"
          onPress={() => setIdea((i) => i + 1)}
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-chip active:scale-95">
          <RefreshCw color={colors.fg} size={20} strokeWidth={1.9} />
        </Pressable>
        <View className="flex-1">
          <PrimaryButton
            label="Ajouter à mon journal"
            onPress={() =>
              addMeal({
                name: dish.name,
                loggedAt: `${toISODate(now)}T${now.toTimeString().slice(0, 8)}`,
                macros: {
                  calories: dish.kcal,
                  protein: dish.protein,
                  carbs: Math.round((dish.kcal * 0.45) / 4),
                  fat: Math.round((dish.kcal * 0.25) / 9),
                },
                confidence: 0.7,
              })
            }
          />
        </View>
      </View>
    </Card>
  );
}
