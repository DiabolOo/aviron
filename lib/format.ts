import type { Macros } from '@/lib/types';

export function formatKcal(value: number): string {
  return `${Math.round(value)}`;
}

export function formatGrams(value: number): string {
  return `${Math.round(value)} g`;
}

export function clampRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export function remainingCalories(consumed: number, burned: number, target: number): number {
  return Math.round(target - consumed + burned);
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
