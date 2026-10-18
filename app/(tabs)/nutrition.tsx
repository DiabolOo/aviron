import { PenLine, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AddMealSheet } from '@/components/nutrition/AddMealSheet';
import { DateSelector } from '@/components/nutrition/DateSelector';
import { MacroSummary } from '@/components/nutrition/MacroSummary';
import { MealJournal } from '@/components/nutrition/MealJournal';
import { ScanButton } from '@/components/nutrition/ScanButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { TabHeader } from '@/components/ui/TabHeader';
import { formatKcal } from '@/lib/format';
import { usePulseFitStore, useStatsForDate } from '@/lib/store';
import type { Macros } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

const MACRO_CHIPS: { key: Exclude<keyof Macros, 'calories'>; label: string; dot: string }[] = [
  { key: 'protein', label: 'P', dot: 'bg-accent' },
  { key: 'carbs', label: 'G', dot: 'bg-aqua' },
  { key: 'fat', label: 'L', dot: 'bg-iris' },
];

export default function NutritionScreen() {
  const { colors } = useTheme();
  const selectedDate = usePulseFitStore((s) => s.selectedDate);
  const { profile, consumed, dayMeals } = useStatsForDate(selectedDate);
  const addMeal = usePulseFitStore((s) => s.addMeal);
  const [adding, setAdding] = useState(false);

  return (
    <Screen>
      <TabHeader
        icon={UtensilsCrossed}
        tint="accent"
        eyebrow="Assiette du jour"
        title="Nutrition"
        subtitle={`${formatKcal(consumed.calories)} / ${formatKcal(profile.macrosTarget.calories)} kcal`}>
        <View className="mt-4 flex-row gap-2">
          {MACRO_CHIPS.map(({ key, label, dot }) => (
            <View
              key={key}
              className="flex-1 flex-row items-center gap-2 rounded-full border border-fg/10 bg-surface px-3 py-1.5">
              <View className={`h-2 w-2 rounded-full ${dot}`} />
              <Text className="text-xs text-fg">
                {Math.round(consumed[key])}
                <Text className="text-muted">/{Math.round(profile.macrosTarget[key])} {label}</Text>
              </Text>
            </View>
          ))}
        </View>
      </TabHeader>
      <DateSelector />
      <ScanButton />
      <View className="mt-3">
        <PrimaryButton
          variant="ghost"
          label="Ajout manuel"
          icon={<PenLine color={colors.fg} size={16} strokeWidth={1.8} />}
          onPress={() => setAdding(true)}
        />
      </View>
      <MacroSummary consumed={consumed} target={profile.macrosTarget} />
      <MealJournal meals={dayMeals} onAddMeal={() => setAdding(true)} />
      <AddMealSheet
        visible={adding}
        date={selectedDate}
        onClose={() => setAdding(false)}
        onAdd={addMeal}
      />
    </Screen>
  );
}
