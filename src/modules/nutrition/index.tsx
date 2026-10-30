import { MealTimeline } from '@/components/dashboard/MealTimeline';
import { NutritionWidget } from '@/components/dashboard/NutritionWidget';
import { useTodayStats } from '@/lib/store';
import { FoodItemSchema, MealSchema } from '@/src/core/schemas';
import type { LifeModule } from '@/src/modules/types';

function CalorieRing() {
  const { profile, consumed, remaining } = useTodayStats();
  return (
    <NutritionWidget consumed={consumed} target={profile.macrosTarget} remaining={remaining} />
  );
}

function TodayMeals() {
  const { todaysMeals } = useTodayStats();
  return <MealTimeline meals={todaysMeals} />;
}

export const nutritionModule: LifeModule = {
  id: 'nutrition',
  title: 'Nutrition',
  enabledByDefault: true,
  entities: [MealSchema, FoodItemSchema],
  todayWidgets: [
    { id: 'calorie-ring', order: 10, Component: CalorieRing },
    { id: 'meal-timeline', order: 50, Component: TodayMeals },
  ],
  dashboards: [],
  agentTools: [
    {
      name: 'get_nutrition_summary',
      description: 'Résumé des apports et objectifs nutritionnels récents',
      access: 'read',
    },
    {
      name: 'log_meal',
      description: 'Enregistrer un repas dans le journal',
      access: 'write',
    },
  ],
  analyzers: [],
};
