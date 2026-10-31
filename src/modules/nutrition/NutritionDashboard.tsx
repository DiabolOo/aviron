import { useState } from 'react';
import { View } from 'react-native';

import { AddMealSheet } from '@/components/nutrition/AddMealSheet';
import { DateSelector } from '@/components/nutrition/DateSelector';
import { MacroSummary } from '@/components/nutrition/MacroSummary';
import { MealJournal } from '@/components/nutrition/MealJournal';
import { usePulseFitStore, useStatsForDate } from '@/lib/store';

export function NutritionDashboard() {
  const selectedDate = usePulseFitStore((s) => s.selectedDate);
  const { profile, consumed, dayMeals } = useStatsForDate(selectedDate);
  const addMeal = usePulseFitStore((s) => s.addMeal);
  const [adding, setAdding] = useState(false);

  return (
    <View className="gap-3.5">
      <DateSelector />
      <MacroSummary consumed={consumed} target={profile.macrosTarget} />
      <MealJournal meals={dayMeals} onAddMeal={() => setAdding(true)} />
      <AddMealSheet
        visible={adding}
        date={selectedDate}
        onClose={() => setAdding(false)}
        onAdd={addMeal}
      />
    </View>
  );
}
