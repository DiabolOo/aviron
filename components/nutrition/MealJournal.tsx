import { Pencil, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MealEditSheet } from '@/components/nutrition/MealEditSheet';
import { Label } from '@/components/ui/Label';
import { mealMomentForHour } from '@/lib/dates';
import { formatKcal, sumMacros } from '@/lib/format';
import { usePulseFitStore } from '@/lib/store';
import type { Meal, MealMoment } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type MealJournalProps = {
  meals: Meal[];
};

const MOMENTS: { id: MealMoment; label: string }[] = [
  { id: 'morning', label: 'Matin' },
  { id: 'noon', label: 'Midi' },
  { id: 'snack', label: 'Collation' },
  { id: 'evening', label: 'Soir' },
];

function mealDate(loggedAt: string): Date {
  return new Date(loggedAt);
}

function mealTime(loggedAt: string): string {
  const date = mealDate(loggedAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function MealJournal({ meals }: MealJournalProps) {
  const { colors } = useTheme();
  const updateMeal = usePulseFitStore((s) => s.updateMeal);
  const deleteMeal = usePulseFitStore((s) => s.deleteMeal);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  return (
    <View className="mt-10">
      <Label>Journal</Label>
      {meals.length === 0 ? (
        <View className="mt-5 items-center rounded-3xl border border-fg/5 bg-surface px-6 py-10">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-fg/5">
            <UtensilsCrossed color={colors.muted} size={20} strokeWidth={1.8} />
          </View>
          <Text className="mt-4 text-sm text-muted">Aucun repas enregistré pour ce jour</Text>
        </View>
      ) : (
        MOMENTS.map((moment) => {
          const items = meals
            .filter((meal) => mealMomentForHour(mealDate(meal.loggedAt).getHours()) === moment.id)
            .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
          const total = sumMacros(items.map((meal) => meal.macros)).calories;

          return (
            <View key={moment.id} className="mt-5">
              <View className="flex-row items-baseline justify-between">
                <Text className="text-base font-semibold text-fg">{moment.label}</Text>
                <Text className="text-sm text-muted">
                  {items.length > 0 ? `${formatKcal(total)} kcal` : '—'}
                </Text>
              </View>
              {items.map((meal) => (
                <Pressable
                  key={meal.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Modifier ${meal.name}`}
                  onPress={() => setEditingMeal(meal)}
                  className="mt-2 flex-row items-center border-t border-fg/5 pt-3 active:opacity-70">
                  <Text className="w-14 font-mono text-xs text-muted">
                    {mealTime(meal.loggedAt)}
                  </Text>
                  <Text numberOfLines={1} className="flex-1 pr-3 text-sm text-fg">
                    {meal.name}
                  </Text>
                  <Text className="text-sm text-muted">{formatKcal(meal.macros.calories)}</Text>
                  <View className="ml-3">
                    <Pencil color={colors.muted} size={13} strokeWidth={1.8} />
                  </View>
                </Pressable>
              ))}
            </View>
          );
        })
      )}
      <MealEditSheet
        meal={editingMeal}
        onClose={() => setEditingMeal(null)}
        onSave={updateMeal}
        onDelete={deleteMeal}
      />
    </View>
  );
}
