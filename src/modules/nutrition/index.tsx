import { Apple } from 'lucide-react-native';

import { FoodItemSchema, MealSchema } from '@/src/core/schemas';
import type { LifeModule } from '@/src/modules/types';

/** Hors bêta : interface supprimée (tag `pre-v3`), couche données conservée, module désactivé par défaut. */
export const nutritionModule: LifeModule = {
  id: 'nutrition',
  title: 'Nutrition',
  description: 'Cibles, repas, journal',
  icon: Apple,
  color: 'nutri',
  enabledByDefault: false,
  entities: [MealSchema, FoodItemSchema],
  todayWidgets: [],
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
