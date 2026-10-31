import { usualMealsForHour } from './habits';
import type { Meal } from './types';

const macros = { calories: 500, protein: 30, carbs: 50, fat: 15 };
const meal = (id: string, name: string, hour: number): Meal => ({
  id,
  name,
  loggedAt: `2026-10-2${id}T${String(hour).padStart(2, '0')}:00:00`,
  macros,
  confidence: 1,
});

describe('usualMealsForHour', () => {
  it('classe les repas du même moment par fréquence', () => {
    const meals = [
      meal('1', 'Poulet riz', 12),
      meal('2', 'Poulet riz', 13),
      meal('3', 'Salade', 12),
      meal('4', 'Skyr', 8),
    ];
    const result = usualMealsForHour(meals, 12);
    expect(result.map((m) => m.name)).toEqual(['Poulet riz', 'Salade']);
    expect(result[0].count).toBe(2);
  });

  it('respecte la limite', () => {
    const meals = ['a', 'b', 'c', 'd'].map((n, i) => meal(String(i), n, 12));
    expect(usualMealsForHour(meals, 12, 2)).toHaveLength(2);
  });
});
