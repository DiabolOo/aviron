import { getDailyBalance, getKcalSeries } from './balance';
import type { Meal, UserProfile, WorkoutSession } from './types';

const profile: UserProfile = {
  firstName: 'Alex',
  goalLabel: '',
  calorieTarget: 9999,
  macrosTarget: { calories: 2500, protein: 150, carbs: 300, fat: 80 },
  weightKg: 74,
  targetWeightKg: 74,
};

const meal = (id: string, loggedAt: string, calories: number): Meal => ({
  id,
  name: id,
  loggedAt,
  macros: { calories, protein: 10, carbs: 10, fat: 5 },
  confidence: 1,
});

const session = (id: string, date: string, completed: boolean, caloriesBurn: number): WorkoutSession => ({
  id,
  date,
  title: id,
  kind: 'run',
  subtitle: '',
  durationMin: 45,
  caloriesBurn,
  completed,
});

const DATE = '2026-10-30';

describe('getDailyBalance', () => {
  it('filtre repas et séances par date', () => {
    const balance = getDailyBalance({
      date: DATE,
      profile,
      meals: [meal('m1', `${DATE}T08:00:00`, 400), meal('m2', '2026-10-29T12:00:00', 600)],
      sessions: [session('s1', DATE, true, 500), session('s2', '2026-10-29', true, 700)],
    });
    expect(balance.meals).toHaveLength(1);
    expect(balance.consumed.calories).toBe(400);
    expect(balance.session?.id).toBe('s1');
  });

  it('burned ne compte que les séances complétées du jour', () => {
    const balance = getDailyBalance({
      date: DATE,
      profile,
      meals: [],
      sessions: [
        session('done', DATE, true, 500),
        session('todo', DATE, false, 300),
        session('other', '2026-10-29', true, 900),
      ],
    });
    expect(balance.burned).toBe(500);
    expect(balance.budget).toBe(3000);
  });

  it('macrosTarget est la seule source de l’objectif, même si calorieTarget diffère', () => {
    const balance = getDailyBalance({ date: DATE, profile, meals: [], sessions: [] });
    expect(balance.target.calories).toBe(2500);
    expect(balance.budget).toBe(2500);
  });

  it('remaining = budget − consumed, y compris négatif', () => {
    const balance = getDailyBalance({
      date: DATE,
      profile,
      meals: [meal('m1', `${DATE}T20:00:00`, 2700)],
      sessions: [],
    });
    expect(balance.remaining).toBe(-200);
  });
});

describe('getKcalSeries', () => {
  const add = (d: string, n: number) => {
    const date = new Date(`${d}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + n);
    return date.toISOString().slice(0, 10);
  };

  it('renvoie une valeur par jour, le dernier étant aujourd’hui', () => {
    const series = getKcalSeries({
      endDate: '2026-10-30',
      days: 7,
      profile: { macrosTarget: { calories: 2000, protein: 0, carbs: 0, fat: 0 } } as UserProfile,
      meals: [
        {
          id: 'm',
          name: 'x',
          loggedAt: '2026-10-30T12:00:00',
          macros: { calories: 1000, protein: 0, carbs: 0, fat: 0 },
          confidence: 1,
        } as Meal,
      ],
      addDays: add,
    });
    expect(series).toHaveLength(7);
    expect(series[0].date).toBe('2026-10-24');
    expect(series[6]).toMatchObject({ isToday: true, consumed: 1000, ratio: 0.5 });
  });
});
