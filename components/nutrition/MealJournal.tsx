import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { mealMomentForHour } from '@/lib/dates';
import { formatKcal, sumMacros } from '@/lib/format';
import type { Meal, MealMoment } from '@/lib/types';

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
  return (
    <View className="mt-10">
      <Label>Journal</Label>
      {MOMENTS.map((moment) => {
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
              <View key={meal.id} className="mt-2 flex-row items-center border-t border-fg/5 pt-3">
                <Text className="w-14 font-mono text-xs text-muted">{mealTime(meal.loggedAt)}</Text>
                <Text numberOfLines={1} className="flex-1 pr-3 text-sm text-fg">
                  {meal.name}
                </Text>
                <Text className="text-sm text-muted">{formatKcal(meal.macros.calories)}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}
