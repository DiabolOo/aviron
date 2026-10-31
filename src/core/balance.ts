import { sumMacros } from '@/src/core/format';
import type { Macros, Meal, UserProfile, WorkoutSession } from '@/src/core/types';

export type DailyBalance = {
  date: string;
  target: Macros;
  consumed: Macros;
  burned: number;
  budget: number;
  remaining: number;
  meals: Meal[];
  session?: WorkoutSession;
};

export function getDailyBalance(params: {
  date: string;
  profile: UserProfile;
  meals: Meal[];
  sessions: WorkoutSession[];
}): DailyBalance {
  const { date, profile, meals, sessions } = params;

  const dayMeals = meals.filter((meal) => meal.loggedAt.startsWith(date));
  const consumed = sumMacros(dayMeals.map((meal) => meal.macros));
  const burned = sessions
    .filter((session) => session.date === date && session.completed)
    .reduce((sum, session) => sum + session.caloriesBurn, 0);
  const target = profile.macrosTarget;
  const budget = target.calories + burned;

  return {
    date,
    target,
    consumed,
    burned,
    budget,
    remaining: Math.round(budget - consumed.calories),
    meals: dayMeals,
    session: sessions.find((session) => session.date === date),
  };
}

export type DaySeriesPoint = { date: string; consumed: number; ratio: number; isToday: boolean };

export function getKcalSeries(params: {
  endDate: string;
  days: number;
  profile: UserProfile;
  meals: Meal[];
  addDays: (date: string, n: number) => string;
}): DaySeriesPoint[] {
  const { endDate, days, profile, meals, addDays } = params;
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(endDate, i - (days - 1));
    const consumed = sumMacros(
      meals.filter((meal) => meal.loggedAt.startsWith(date)).map((meal) => meal.macros),
    ).calories;
    const target = profile.macrosTarget.calories;
    return {
      date,
      consumed,
      ratio: target > 0 ? Math.min(1, consumed / target) : 0,
      isToday: date === endDate,
    };
  });
}
