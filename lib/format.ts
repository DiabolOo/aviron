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

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${`${m}`.padStart(2, '0')}` : `${m} min`;
}

export function formatPace(distanceKm: number, minutes: number): string {
  if (distanceKm <= 0) return '–';
  const secPerKm = Math.round((minutes * 60) / distanceKm);
  return `${Math.floor(secPerKm / 60)}:${`${secPerKm % 60}`.padStart(2, '0')} /km`;
}

export function formatSpeed(distanceKm: number, minutes: number): string {
  if (minutes <= 0) return '–';
  return `${((distanceKm / minutes) * 60).toFixed(1)} km/h`;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
