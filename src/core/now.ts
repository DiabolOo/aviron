import { mealMomentForHour } from './dates';
import type { MealMoment } from './types';

export type NowAction =
  | { kind: 'log_meal'; moment: MealMoment; title: string }
  | { kind: 'workout'; sessionId: string; title: string }
  | { kind: 'idle'; title: string };

export type NowInput = {
  hour: number;
  mealHours: number[];
  session?: { id: string; title: string; completed: boolean };
};

const MOMENT_TITLE: Record<MealMoment, string> = {
  morning: 'Petit-déjeuner',
  noon: 'Déjeuner',
  snack: 'Collation',
  evening: 'Dîner',
};

const MEAL_WINDOWS: Record<MealMoment, [number, number]> = {
  morning: [6, 10],
  noon: [11, 14],
  snack: [99, 99],
  evening: [18, 21],
};

export function getNowAction({ hour, mealHours, session }: NowInput): NowAction {
  const moment = mealMomentForHour(hour);
  const [from, to] = MEAL_WINDOWS[moment];
  const mealDue = hour >= from && hour <= to && !mealHours.some((h) => mealMomentForHour(h) === moment);

  if (mealDue) return { kind: 'log_meal', moment, title: MOMENT_TITLE[moment] };
  if (session && !session.completed) {
    return { kind: 'workout', sessionId: session.id, title: session.title };
  }
  return { kind: 'idle', title: 'Tout est à jour' };
}
