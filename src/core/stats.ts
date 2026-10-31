import { addDaysISO } from './dates';
import type { Meal, StravaActivity } from './types';

export type StatsPeriod = 'week' | 'month' | 'year';

export const PERIOD_DAYS: Record<StatsPeriod, number> = { week: 7, month: 30, year: 365 };
const BUCKETS: Record<StatsPeriod, number> = { week: 7, month: 5, year: 12 };
export const PERIOD_COMPARE: Record<StatsPeriod, string> = {
  week: 'vs semaine dernière',
  month: 'vs mois dernier',
  year: 'vs année dernière',
};

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

function bucketOf(period: StatsPeriod, ageDays: number): number {
  const days = PERIOD_DAYS[period];
  return BUCKETS[period] - 1 - Math.floor((ageDays * BUCKETS[period]) / days);
}

function bucketLabel(period: StatsPeriod, bucket: number, today: string): string {
  if (period === 'month') return `S${bucket + 1}`;
  const n = BUCKETS[period];
  const ageDays = Math.round(((n - 1 - bucket) * PERIOD_DAYS[period]) / n);
  const date = addDaysISO(today, -ageDays);
  if (period === 'week') return WEEKDAY_INITIALS[new Date(`${date}T00:00:00`).getDay()];
  return MONTH_INITIALS[Number(date.slice(5, 7)) - 1];
}

export type SportStats = {
  km: number;
  sessions: number;
  deltaPct: number | null;
  bars: { label: string; ratio: number; current: boolean }[];
};

export function buildSportStats(params: {
  period: StatsPeriod;
  today: string;
  activities: Pick<StravaActivity, 'date' | 'distanceKm'>[];
}): SportStats {
  const { period, today, activities } = params;
  const days = PERIOD_DAYS[period];
  const n = BUCKETS[period];
  const totals = Array<number>(n).fill(0);
  let km = 0;
  let sessions = 0;
  let previous = 0;

  for (const activity of activities) {
    const age = daysBetween(activity.date.slice(0, 10), today);
    if (age < 0) continue;
    if (age < days) {
      km += activity.distanceKm;
      sessions += 1;
      totals[bucketOf(period, age)] += activity.distanceKm;
    } else if (age < days * 2) {
      previous += activity.distanceKm;
    }
  }

  const max = Math.max(...totals, 0);
  return {
    km: Math.round(km * 10) / 10,
    sessions,
    deltaPct: previous > 0 ? Math.round(((km - previous) / previous) * 100) : null,
    bars: totals.map((value, i) => ({
      label: bucketLabel(period, i, today),
      ratio: max > 0 ? Math.max(0.08, value / max) : 0.08,
      current: i === n - 1,
    })),
  };
}

export type NutritionStats = { avgKcal: number; targetKcal: number; points: number[] };

export function buildNutritionStats(params: {
  period: StatsPeriod;
  today: string;
  meals: Pick<Meal, 'loggedAt' | 'macros'>[];
  targetKcal: number;
}): NutritionStats {
  const { period, today, meals, targetKcal } = params;
  const days = PERIOD_DAYS[period];
  const n = BUCKETS[period];
  const perDay = new Map<string, number>();

  for (const meal of meals) {
    const date = meal.loggedAt.slice(0, 10);
    const age = daysBetween(date, today);
    if (age >= 0 && age < days) perDay.set(date, (perDay.get(date) ?? 0) + meal.macros.calories);
  }

  const sums = Array<number>(n).fill(0);
  const counts = Array<number>(n).fill(0);
  for (const [date, kcal] of perDay) {
    const b = bucketOf(period, daysBetween(date, today));
    sums[b] += kcal;
    counts[b] += 1;
  }
  const total = [...perDay.values()].reduce((s, v) => s + v, 0);

  return {
    avgKcal: perDay.size > 0 ? Math.round(total / perDay.size) : 0,
    targetKcal,
    points: sums.map((s, i) => (counts[i] > 0 ? Math.round(s / counts[i]) : 0)),
  };
}
