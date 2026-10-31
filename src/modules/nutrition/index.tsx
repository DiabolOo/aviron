import { Apple } from 'lucide-react-native';

import { NutritionWidget } from '@/components/dashboard/NutritionWidget';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { getKcalSeries } from '@/src/core/balance';
import { addDaysISO } from '@/src/core/dates';
import { FoodItemSchema, MealSchema } from '@/src/core/schemas';
import { DinnerHero } from '@/src/modules/nutrition/DinnerHero';
import { NutritionDashboard } from '@/src/modules/nutrition/NutritionDashboard';
import { NutritionPlan } from '@/src/modules/nutrition/NutritionPlan';
import { NutritionStats } from '@/src/modules/nutrition/NutritionStats';
import type { LifeModule } from '@/src/modules/types';

function CalorieCard() {
  const { remaining, today } = useTodayStats();
  const profile = usePulseFitStore((s) => s.profile);
  const meals = usePulseFitStore((s) => s.meals);
  const series = getKcalSeries({ endDate: today, days: 7, profile, meals, addDays: addDaysISO });
  return <NutritionWidget remaining={remaining} series={series} />;
}

export const nutritionModule: LifeModule = {
  id: 'nutrition',
  title: 'Nutrition',
  description: 'Cibles, repas, journal',
  icon: Apple,
  color: 'nutri',
  enabledByDefault: true,
  entities: [MealSchema, FoodItemSchema],
  todayWidgets: [
    { id: 'dinner-hero', order: 10, Component: DinnerHero },
    { id: 'calorie-card', order: 20, Component: CalorieCard, half: true },
  ],
  plans: [{ id: 'nutrition-plan', title: 'Nutrition', Component: NutritionPlan }],
  dashboards: [{ id: 'nutrition', title: 'Nutrition', Component: NutritionDashboard }],
  stats: [{ id: 'nutrition-stats', title: 'Nutrition', Component: NutritionStats }],
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
  agentExamples: ['J’ai mangé des pâtes', 'Planifie ma semaine de repas'],
  analyzers: [],
};
