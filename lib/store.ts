import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toISODate } from '@/lib/dates';
import { remainingCalories, sumMacros, uid } from '@/lib/format';
import { MOCK_MEALS, MOCK_PROFILE, buildWeekSessions, mockAdaptWeek, mockAnalyzePlate } from '@/lib/mock';
import type {
    FatigueLevel,
    Meal,
    ScanStep,
    ThemePreference,
    TimeBudget,
    UserProfile,
    WorkoutSession,
} from '@/lib/types';

type PulseFitState = {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  profile: UserProfile;
  sessions: WorkoutSession[];
  meals: Meal[];
  scanStep: ScanStep;
  pendingMeal: Meal | null;
  isAdapting: boolean;
  completeSession: (id: string) => void;
  analyzePhoto: (uri: string) => Promise<void>;
  savePendingMeal: () => void;
  discardPendingMeal: () => void;
  adaptWeek: (fatigue: FatigueLevel, timeBudget: TimeBudget) => Promise<void>;
};

function todayKey(): string {
  return toISODate(new Date());
}

export const usePulseFitStore = create<PulseFitState>()(
  persist(
    (set, get) => ({
      themePreference: 'system',
      setThemePreference: (value) => set({ themePreference: value }),
      profile: MOCK_PROFILE,
      sessions: buildWeekSessions(),
      meals: MOCK_MEALS,
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
      analyzePhoto: async (uri) => {
        set({ scanStep: 'analyzing', pendingMeal: null });
        const meal = await mockAnalyzePlate(uri);
        set({ scanStep: 'result', pendingMeal: meal });
      },
      savePendingMeal: () => {
        const pending = get().pendingMeal;
        if (!pending) return;
        set({
          meals: [{ ...pending, id: uid('meal') }, ...get().meals],
          pendingMeal: null,
          scanStep: 'idle',
        });
      },
      discardPendingMeal: () => {
        set({ pendingMeal: null, scanStep: 'idle' });
      },
      adaptWeek: async (fatigue, timeBudget) => {
        set({ isAdapting: true });
        const next = await mockAdaptWeek({
          fatigue,
          timeBudget,
          sessions: get().sessions,
        });
        set({ sessions: next, isAdapting: false });
      },
    }),
    {
      name: 'pulsefit-mvp',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themePreference: state.themePreference,
        profile: state.profile,
        sessions: state.sessions,
        meals: state.meals,
      }),
    },
  ),
);

export function useTodayStats() {
  const profile = usePulseFitStore((s) => s.profile);
  const meals = usePulseFitStore((s) => s.meals);
  const sessions = usePulseFitStore((s) => s.sessions);
  const today = todayKey();

  const todaysMeals = meals.filter((meal) => meal.loggedAt.startsWith(today));
  const consumed = sumMacros(todaysMeals.map((meal) => meal.macros));
  const todaysSession = sessions.find((session) => session.date === today);
  const burned = sessions
    .filter((session) => session.date === today && session.completed)
    .reduce((sum, session) => sum + session.caloriesBurn, 0);

  return {
    profile,
    today,
    todaysMeals,
    consumed,
    burned,
    remaining: remainingCalories(consumed.calories, burned, profile.calorieTarget),
    todaysSession,
  };
}
