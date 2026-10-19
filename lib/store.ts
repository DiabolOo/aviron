import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addDaysISO, toISODate } from '@/lib/dates';
import { remainingCalories, sumMacros, uid } from '@/lib/format';
import {
  MOCK_MEALS,
  MOCK_PROFILE,
  MOCK_WEATHER,
  buildStravaActivities,
  buildWeekSessions,
  mockAdaptWeek,
  mockAnalyzePlate,
} from '@/lib/mock';
import type {
  FatigueLevel,
  Meal,
  ScanStep,
  StravaActivity,
  ThemePreference,
  TimeBudget,
  UserProfile,
  Weather,
  WorkoutSession,
} from '@/lib/types';

type PulseFitState = {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  profile: UserProfile;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (profileData: Partial<UserProfile>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setCalorieTarget: (calories: number) => void;
  stravaConnected: boolean;
  watchConnected: boolean;
  toggleStrava: () => void;
  toggleWatch: () => void;
  activities: StravaActivity[];
  weather: Weather;
  sessions: WorkoutSession[];
  meals: Meal[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  scanStep: ScanStep;
  pendingMeal: Meal | null;
  isAdapting: boolean;
  completeSession: (id: string) => void;
  resetWeek: () => void;
  analyzePhoto: (uri: string) => Promise<void>;
  savePendingMeal: () => void;
  discardPendingMeal: () => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  deleteMeal: (mealId: string) => void;
  updateMeal: (mealId: string, updatedMeal: Partial<Meal>) => void;
  adaptWeek: (fatigue: FatigueLevel, timeBudget: TimeBudget) => Promise<void>;
};

type PersistedState = Pick<
  PulseFitState,
  | 'themePreference'
  | 'profile'
  | 'hasCompletedOnboarding'
  | 'stravaConnected'
  | 'watchConnected'
  | 'sessions'
  | 'meals'
>;

function todayKey(): string {
  return toISODate(new Date());
}

export const usePulseFitStore = create<PulseFitState>()(
  persist(
    (set, get) => ({
      themePreference: 'light',
      setThemePreference: (value) => set({ themePreference: value }),
      profile: MOCK_PROFILE,
      hasCompletedOnboarding: false,
      completeOnboarding: (profileData) =>
        set({ profile: { ...get().profile, ...profileData }, hasCompletedOnboarding: true }),
      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      setCalorieTarget: (calories) => {
        const profile = get().profile;
        set({
          profile: {
            ...profile,
            calorieTarget: calories,
            macrosTarget: { ...profile.macrosTarget, calories },
          },
        });
      },
      stravaConnected: true,
      watchConnected: false,
      toggleStrava: () => set({ stravaConnected: !get().stravaConnected }),
      toggleWatch: () => set({ watchConnected: !get().watchConnected }),
      activities: buildStravaActivities(),
      weather: MOCK_WEATHER,
      sessions: buildWeekSessions(),
      meals: MOCK_MEALS,
      selectedDate: todayKey(),
      setSelectedDate: (date) => set({ selectedDate: date }),
      goToPreviousDay: () => set({ selectedDate: addDaysISO(get().selectedDate, -1) }),
      goToNextDay: () => {
        const next = addDaysISO(get().selectedDate, 1);
        if (next <= todayKey()) set({ selectedDate: next });
      },
      goToToday: () => set({ selectedDate: todayKey() }),
      scanStep: 'idle',
      pendingMeal: null,
      isAdapting: false,
      completeSession: (id) => {
        set({
          sessions: get().sessions.map((session) =>
            session.id === id ? { ...session, completed: true } : session,
          ),
        });
      },
      resetWeek: () => set({ sessions: buildWeekSessions() }),
      analyzePhoto: async (uri) => {
        set({ scanStep: 'analyzing', pendingMeal: null });
        try {
          const meal = await mockAnalyzePlate(uri);
          set({ scanStep: 'result', pendingMeal: meal });
        } catch {
          set({ scanStep: 'error', pendingMeal: null });
        }
      },
      savePendingMeal: () => {
        const pending = get().pendingMeal;
        if (!pending) return;
        const time = pending.loggedAt.split('T')[1] ?? '12:00:00';
        set({
          meals: [
            { ...pending, id: uid('meal'), loggedAt: `${get().selectedDate}T${time}` },
            ...get().meals,
          ],
          pendingMeal: null,
          scanStep: 'idle',
        });
      },
      discardPendingMeal: () => {
        set({ pendingMeal: null, scanStep: 'idle' });
      },
      addMeal: (meal) => {
        set({ meals: [{ ...meal, id: uid('meal') }, ...get().meals] });
      },
      deleteMeal: (mealId) => {
        set({ meals: get().meals.filter((meal) => meal.id !== mealId) });
      },
      updateMeal: (mealId, updatedMeal) => {
        set({
          meals: get().meals.map((meal) =>
            meal.id === mealId ? { ...meal, ...updatedMeal } : meal,
          ),
        });
      },
      adaptWeek: async (fatigue, timeBudget) => {
        set({ isAdapting: true });
        try {
          const next = await mockAdaptWeek({
            fatigue,
            timeBudget,
            sessions: get().sessions,
          });
          set({ sessions: next });
        } finally {
          set({ isAdapting: false });
        }
      },
    }),
    {
      name: 'pulsefit-mvp2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedState => ({
        themePreference: state.themePreference,
        profile: state.profile,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        stravaConnected: state.stravaConnected,
        watchConnected: state.watchConnected,
        sessions: state.sessions,
        meals: state.meals,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...saved,
          profile: { ...current.profile, ...saved.profile },
        };
      },
    },
  ),
);

export function useStatsForDate(date: string) {
  const profile = usePulseFitStore((s) => s.profile);
  const meals = usePulseFitStore((s) => s.meals);
  const sessions = usePulseFitStore((s) => s.sessions);

  const dayMeals = meals.filter((meal) => meal.loggedAt.startsWith(date));
  const consumed = sumMacros(dayMeals.map((meal) => meal.macros));
  const daySession = sessions.find((session) => session.date === date);
  const burned = sessions
    .filter((session) => session.date === date && session.completed)
    .reduce((sum, session) => sum + session.caloriesBurn, 0);

  return {
    profile,
    date,
    dayMeals,
    consumed,
    burned,
    remaining: remainingCalories(consumed.calories, burned, profile.calorieTarget),
    daySession,
  };
}

export function useStreak(): number {
  const sessions = usePulseFitStore((s) => s.sessions);
  const activities = usePulseFitStore((s) => s.activities);

  const active = new Set<string>([
    ...sessions.filter((session) => session.completed).map((session) => session.date),
    ...activities.map((activity) => activity.date.slice(0, 10)),
  ]);

  let cursor = todayKey();
  if (!active.has(cursor)) cursor = addDaysISO(cursor, -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function useTodayStats() {
  const today = todayKey();
  const stats = useStatsForDate(today);

  return {
    ...stats,
    today,
    todaysMeals: stats.dayMeals,
    todaysSession: stats.daySession,
  };
}
