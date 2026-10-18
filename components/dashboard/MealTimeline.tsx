import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { formatKcal } from '@/lib/format';
import type { Meal } from '@/lib/types';

type MealTimelineProps = {
  meals: Meal[];
};

function mealTime(loggedAt: string): string {
  const date = new Date(loggedAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function MealTimeline({ meals }: MealTimelineProps) {
  return (
    <View className="mt-10">
      <Label>Repas</Label>
      {meals.length === 0 ? (
        <Text className="mt-4 text-sm text-muted">Aucun repas — scanne ton premier plat.</Text>
      ) : (
        <View className="mt-2">
          {meals.map((meal, index) => (
            <View
              key={meal.id}
              className={`flex-row items-center py-4 ${index > 0 ? 'border-t border-fg/5' : ''}`}>
              <Text className="w-14 font-mono text-xs text-muted">{mealTime(meal.loggedAt)}</Text>
              <Text numberOfLines={1} className="flex-1 pr-3 text-base text-fg">
                {meal.name}
              </Text>
              <Text className="text-base font-semibold text-fg">
                {formatKcal(meal.macros.calories)}
                <Text className="text-xs font-normal text-muted"> kcal</Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
