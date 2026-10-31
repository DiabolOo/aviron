import { mealMomentForHour } from './dates';
import type { Macros, Meal } from './types';

export type UsualMeal = { name: string; macros: Macros; count: number };

export function usualMealsForHour(meals: Meal[], hour: number, limit = 3): UsualMeal[] {
  const moment = mealMomentForHour(hour);
  const byName = new Map<string, UsualMeal>();
  for (const meal of meals) {
    if (mealMomentForHour(new Date(meal.loggedAt).getHours()) !== moment) continue;
    const key = meal.name.trim().toLowerCase();
    const current = byName.get(key);
    if (current) current.count += 1;
    else byName.set(key, { name: meal.name, macros: meal.macros, count: 1 });
  }
  return [...byName.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function mealsOfDayAt(meals: Meal[], date: string): Meal[] {
  return meals.filter((meal) => meal.loggedAt.startsWith(date));
}
