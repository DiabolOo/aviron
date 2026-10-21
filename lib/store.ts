import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addDaysISO, mealMomentForHour, toISODate } from '@/lib/dates';
import { remainingCalories, sumMacros, uid } from '@/lib/format';
import {
  MOCK_MEALS,
  MOCK_PROFILE,
  MOCK_RECIPES,
  MOCK_WEATHER,
  buildStravaActivities,
  buildWeekSessions,
  mockAdaptWeek,
  mockAnalyzePlate
} from '@/lib/mock';
import type {
  FatigueLevel,
  Meal,
  MealMoment,
  Recipe,
  RecipeMealType,
  ScanStep,
  StravaActivity,
  ThemePreference,
  TimeBudget,
  UserProfile,
  Weather,
  WorkoutSession
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
  savePendingMeal: (saveAsRecipe?: boolean) => void;
  discardPendingMeal: () => void;
  addMeal: (meal: Omit<Meal, 'id'>, saveAsRecipe?: boolean) => void;
  deleteMeal: (mealId: string) => void;
  updateMeal: (mealId: string, updatedMeal: Partial<Meal>) => void;
  savedRecipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  logRecipeToJournal: (recipeId: string, mealType: RecipeMealType) => void;
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
  | 'savedRecipes'
>;

export function currentMealType(date: Date = new Date()): RecipeMealType {
  return MOMENT_TO_MEAL_TYPE[mealMomentForHour(date.getHours())];
}

function recipeFromMeal(meal: Omit<Meal, 'id'>): Recipe {
  return {
    id: uid('recipe'),
    title: meal.name,
    calories: meal.macros.calories,
    protein: meal.macros.protein,
    carbs: meal.macros.carbs,
    fat: meal.macros.fat,
    category: 'custom',
  };
}

function todayKey(): string {
  return toISODate(new Date());
}

const RECIPE_MEAL_HOURS: Record<RecipeMealType, string> = {
  breakfast: '08',
  lunch: '12',
  snack: '16',
  dinner: '20',
};

const MOMENT_TO_MEAL_TYPE: Record<MealMoment, RecipeMealType> = {
  morning: 'breakfast',
  noon: 'lunch',
  snack: 'snack',
  evening: 'dinner',
};

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
      savePendingMeal: (saveAsRecipe = false) => {
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
        if (saveAsRecipe) get().addRecipe(recipeFromMeal(pending));
      },
      discardPendingMeal: () => {
        set({ pendingMeal: null, scanStep: 'idle' });
      },
      addMeal: (meal, saveAsRecipe = false) => {
        set({ meals: [{ ...meal, id: uid('meal') }, ...get().meals] });
        if (saveAsRecipe) get().addRecipe(recipeFromMeal(meal));
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
      savedRecipes: MOCK_RECIPES,
      addRecipe: (recipe) => set({ savedRecipes: [recipe, ...get().savedRecipes] }),
      deleteRecipe: (id) =>
        set({ savedRecipes: get().savedRecipes.filter((recipe) => recipe.id !== id) }),
      logRecipeToJournal: (recipeId, mealType) => {
        const recipe = get().savedRecipes.find((item) => item.id === recipeId);
        if (!recipe) return;
        const { selectedDate } = get();
        const now = new Date();
        const time =
          selectedDate === todayKey() && mealType === currentMealType(now)
            ? now.toTimeString().slice(0, 8)
            : `${RECIPE_MEAL_HOURS[mealType]}:00:00`;
        set({
          meals: [
            {
              id: uid('meal'),
              name: recipe.title,
              loggedAt: `${selectedDate}T${time}`,
              macros: {
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fat,
              },
              confidence: 1,
            },
            ...get().meals,
          ],
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
        savedRecipes: state.savedRecipes,
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
