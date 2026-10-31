import { Mic } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import { addDaysISO, toISODate, weekDates } from '@/src/core/dates';
import { formatKcal } from '@/src/core/format';
import { buildMealPlan } from '@/src/core/mealPlan';
import { MacroBars } from '@/src/modules/nutrition/MacroBars';
import { useTheme } from '@/src/ui/useTheme';
import { router } from 'expo-router';

const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function goalLabel(goal?: string): string {
  if (goal === 'weight_loss') return 'perte de poids';
  if (goal === 'muscle_gain') return 'prise de masse';
  return 'maintien';
}

export function NutritionPlan() {
  const { colors } = useTheme();
  const profile = usePulseFitStore((s) => s.profile);
  const seed = usePulseFitStore((s) => s.mealPlanSeed);
  const ask = useProposalStore((s) => s.ask);
  const week = weekDates();
  const today = toISODate(new Date());
  const [selected, setSelected] = useState(Math.max(0, week.indexOf(today)));
  const [busy, setBusy] = useState(false);
  const plan = buildMealPlan(profile.macrosTarget.calories, seed);
  const date = week[selected] ?? addDaysISO(today, 0);
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const planWeek = async () => {
    setBusy(true);
    try {
      await ask('Planifie ma semaine de repas');
      router.navigate('/agent');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-3.5">
      <Card tint="nutri" className="gap-3 p-[18px]">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[16px] font-medium text-muted">Cibles du jour</Text>
          <Text className="text-[14px] text-muted">Calculées par l’app</Text>
        </View>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-[40px] font-bold leading-[44px] tracking-tight text-fg">
            {formatKcal(profile.macrosTarget.calories)}
          </Text>
          <Text className="text-[16px] text-muted">kcal · {goalLabel(profile.goal)}</Text>
        </View>
        <MacroBars target={profile.macrosTarget} />
      </Card>

      <Card className="gap-2.5 p-[18px]">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[17px] font-semibold text-fg">Semaine de repas</Text>
          <Text className="text-[14px] capitalize text-muted">{dateLabel}</Text>
        </View>
        <View className="flex-row gap-0.5">
          {DAY_INITIALS.map((initial, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={week[i]}
              accessibilityState={{ selected: i === selected }}
              onPress={() => setSelected(i)}
              className={`h-11 flex-1 items-center justify-center rounded-full ${
                i === selected ? 'bg-fg' : ''
              }`}>
              <Text
                className={`text-[16px] ${
                  i === selected ? 'font-semibold text-canvas' : 'font-medium text-muted'
                }`}>
                {initial}
              </Text>
            </Pressable>
          ))}
        </View>
        <View>
          {(plan[selected] ?? []).map((meal, i) => (
            <View
              key={meal.slot}
              className={`flex-row items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-fg/10' : 'border-t border-fg/10'}`}>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text className="text-[14px] text-muted">{meal.label}</Text>
                <Text numberOfLines={1} className="text-[17px] font-semibold text-fg">
                  {meal.name}
                </Text>
              </View>
              <Text className="text-[16px] font-semibold text-fg">
                {meal.kcal}
                <Text className="text-[13px] font-medium text-muted"> kcal</Text>
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View className="flex-row gap-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dicter"
          onPress={() => router.navigate('/agent')}
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-chip active:scale-95">
          <Mic color={colors.fg} size={22} strokeWidth={1.9} />
        </Pressable>
        <View className="flex-1">
          <PrimaryButton label="Planifier ma semaine" onPress={() => void planWeek()} disabled={busy} />
        </View>
      </View>
    </View>
  );
}
