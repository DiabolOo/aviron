import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { agent } from '@/src/agent';
import { getDailyBalance, type DailyBalance } from '@/src/core/balance';
import { addDaysISO, mealMomentForHour, toISODate } from '@/src/core/dates';
import { DEFAULT_PROFILE } from '@/src/core/defaults';
import { uid } from '@/src/core/format';
import { calculateMacros, calculateNutritionTargets } from '@/src/core/nutritionCalculator';
import { buildProgram, buildProgramSessions } from '@/src/core/program';
import type {
  AthleticGoal,
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
  WorkoutProgram,
  WorkoutSession
} from '@/src/core/types';
import { repositories } from '@/src/data/instance';
import { activityToStrava, plannedToSession, sessionToPlanned } from '@/src/data/mappers';
import { seedLocalIfNeeded, type LegacySnapshot } from '@/src/data/seed';

let legacySnapshot: LegacySnapshot | null = null;

type PulseFitState = {
  dataReady: boolean;
  hydrate: () => Promise<void>;
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  profile: UserProfile;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (profileData: Partial<UserProfile>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setCalorieTarget: (calories: number) => void;
  recalculateNutritionGoals: () => void;
  stravaConnected: boolean;
  watchConnected: boolean;
  toggleStrava: () => void;
  toggleWatch: () => void;
  activities: StravaActivity[];
  weather: Weather | null;
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
  activeWorkoutProgram?: WorkoutProgram;
  setAthleticGoal: (goal: AthleticGoal) => void;
  generateWorkoutProgram: () => void;
  resetWorkoutProgram: (keepGoal?: boolean) => void;
};

type PersistedState = Pick<
  PulseFitState,
  | 'themePreference'
  | 'hasCompletedOnboarding'
  | 'stravaConnected'
  | 'watchConnected'
  | 'activeWorkoutProgram'
>;

type LegacyPersistedState = Partial<PersistedState> & {
  profile?: UserProfile;
  meals?: Meal[];
  sessions?: WorkoutSession[];
  savedRecipes?: Recipe[];
};

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

const NUTRITION_RECALC_KEYS: readonly (keyof UserProfile)[] = [
  'sex',
  'ageYears',
  'heightCm',
  'weightKg',
  'targetWeightKg',
  'activityLevel',
  'goal',
  'weeklyPaceKg',
];

export const usePulseFitStore = create<PulseFitState>()(
  persist(
    (set, get) => {
      const setProfile = (next: UserProfile) => {
        const normalized = { ...next, calorieTarget: next.macrosTarget.calories };
        set({ profile: normalized });
        void repositories.profile.save(normalized);
      };

      const persistMeals = (meals: Meal[]) => {
        set({ meals });
      };

      const persistSessions = (sessions: WorkoutSession[]) => {
        set({ sessions });
        void repositories.workouts.replaceAll(sessions.map(sessionToPlanned));
      };

      return {
        dataReady: false,
        hydrate: async () => {
          if (get().dataReady) return;
          await seedLocalIfNeeded(repositories, legacySnapshot ?? undefined);
          const [profile, meals, workouts, recipes, activities, weather] =
            await Promise.all([
              repositories.profile.get(),
              repositories.meals.listAll(),
              repositories.workouts.listAll(),
              repositories.recipes.list(),
              repositories.activities.listRecent(50),
              repositories.weather.getCurrent(),
            ]);
          set({
            profile: profile ? { ...get().profile, ...profile } : get().profile,
            meals,
            sessions: workouts.map(plannedToSession),
            savedRecipes: recipes,
            activities: activities.map(activityToStrava),
            weather,
            dataReady: true,
          });
        },
        themePreference: 'light',
        setThemePreference: (value) => set({ themePreference: value }),
        profile: DEFAULT_PROFILE,
        hasCompletedOnboarding: false,
        completeOnboarding: (profileData) => {
          setProfile({ ...get().profile, ...profileData });
          set({ hasCompletedOnboarding: true });
          get().recalculateNutritionGoals();
        },
        updateProfile: (patch) => {
          setProfile({ ...get().profile, ...patch });
          if (NUTRITION_RECALC_KEYS.some((key) => key in patch)) {
            get().recalculateNutritionGoals();
          }
        },
        setCalorieTarget: (calories) => {
          const profile = get().profile;
          setProfile({
            ...profile,
            calorieTarget: calories,
            macrosTarget: {
              calories,
              ...calculateMacros(profile.weightKg, calories),
            },
          });
        },
        recalculateNutritionGoals: () => {
          const profile = get().profile;
          const targets = calculateNutritionTargets(profile);
          if (!targets) return;
          setProfile({
            ...profile,
            calorieTarget: targets.calories,
            macrosTarget: {
              calories: targets.calories,
              protein: targets.protein,
              carbs: targets.carbs,
              fat: targets.fat,
            },
          });
        },
        stravaConnected: true,
        watchConnected: false,
        toggleStrava: () => set({ stravaConnected: !get().stravaConnected }),
        toggleWatch: () => set({ watchConnected: !get().watchConnected }),
        activities: [],
        weather: null,
        sessions: [],
        meals: [],
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
          persistSessions(
            get().sessions.map((session) =>
              session.id === id ? { ...session, completed: true } : session,
            ),
          );
        },
        resetWeek: async () => {
          const sessions = await agent.generateDefaultWeek();
          persistSessions(sessions);
        },
        analyzePhoto: async (uri) => {
          set({ scanStep: 'analyzing', pendingMeal: null });
          try {
            const meal = await agent.analyzePlate(uri);
            set({ scanStep: 'result', pendingMeal: meal });
          } catch {
            set({ scanStep: 'error', pendingMeal: null });
          }
        },
        savePendingMeal: (saveAsRecipe = false) => {
          const pending = get().pendingMeal;
          if (!pending) return;
          const time = pending.loggedAt.split('T')[1] ?? '12:00:00';
          const meal = { ...pending, id: uid('meal'), loggedAt: `${get().selectedDate}T${time}` };
          persistMeals([meal, ...get().meals]);
          void repositories.meals.upsert(meal);
          set({ pendingMeal: null, scanStep: 'idle' });
          if (saveAsRecipe) get().addRecipe(recipeFromMeal(pending));
        },
        discardPendingMeal: () => {
          set({ pendingMeal: null, scanStep: 'idle' });
        },
        addMeal: (meal, saveAsRecipe = false) => {
          const withId = { ...meal, id: uid('meal') };
          persistMeals([withId, ...get().meals]);
          void repositories.meals.upsert(withId);
          if (saveAsRecipe) get().addRecipe(recipeFromMeal(meal));
        },
        deleteMeal: (mealId) => {
          persistMeals(get().meals.filter((meal) => meal.id !== mealId));
          void repositories.meals.remove(mealId);
        },
        updateMeal: (mealId, updatedMeal) => {
          const meals = get().meals.map((meal) =>
            meal.id === mealId ? { ...meal, ...updatedMeal } : meal,
          );
          persistMeals(meals);
          const updated = meals.find((meal) => meal.id === mealId);
          if (updated) void repositories.meals.upsert(updated);
        },
        savedRecipes: [],
        addRecipe: (recipe) => {
          set({ savedRecipes: [recipe, ...get().savedRecipes] });
          void repositories.recipes.upsert(recipe);
        },
        deleteRecipe: (id) => {
          set({ savedRecipes: get().savedRecipes.filter((recipe) => recipe.id !== id) });
          void repositories.recipes.remove(id);
        },
        logRecipeToJournal: (recipeId, mealType) => {
          const recipe = get().savedRecipes.find((item) => item.id === recipeId);
          if (!recipe) return;
          const { selectedDate } = get();
          const now = new Date();
          const time =
            selectedDate === todayKey() && mealType === currentMealType(now)
              ? now.toTimeString().slice(0, 8)
              : `${RECIPE_MEAL_HOURS[mealType]}:00:00`;
          const meal: Meal = {
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
          };
          persistMeals([meal, ...get().meals]);
          void repositories.meals.upsert(meal);
        },
        activeWorkoutProgram: undefined,
        setAthleticGoal: (goal) => {
          setProfile({ ...get().profile, athleticGoal: goal });
        },
        generateWorkoutProgram: () => {
          const goal = get().profile.athleticGoal;
          if (!goal) return;
          setProfile({ ...get().profile, goalLabel: goal.targetName });
          set({ activeWorkoutProgram: buildProgram(goal) });
          persistSessions(buildProgramSessions(goal));
        },
        resetWorkoutProgram: (keepGoal = false) => {
          const { athleticGoal, ...rest } = get().profile;
          setProfile(keepGoal && athleticGoal ? { ...rest, athleticGoal } : rest);
          set({ activeWorkoutProgram: undefined });
        },
        adaptWeek: async (fatigue, timeBudget) => {
          set({ isAdapting: true });
          try {
            const next = await agent.adaptWeek({
              fatigue,
              timeBudget,
              sessions: get().sessions,
            });
            persistSessions(next);
          } finally {
            set({ isAdapting: false });
          }
        },
      };
    },
    {
      name: 'pulsefit-mvp3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedState => ({
        themePreference: state.themePreference,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        stravaConnected: state.stravaConnected,
        watchConnected: state.watchConnected,
        activeWorkoutProgram: state.activeWorkoutProgram,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as LegacyPersistedState;
        legacySnapshot = {
          profile: saved.profile,
          meals: saved.meals,
          sessions: saved.sessions,
          savedRecipes: saved.savedRecipes,
        };
        const rest = { ...saved };
        delete rest.profile;
        delete rest.meals;
        delete rest.sessions;
        delete rest.savedRecipes;
        return { ...current, ...rest };
      },
    },
  ),
);

export function useDailyBalance(date: string): DailyBalance {
  const profile = usePulseFitStore((s) => s.profile);
  const meals = usePulseFitStore((s) => s.meals);
  const sessions = usePulseFitStore((s) => s.sessions);

  return getDailyBalance({ date, profile, meals, sessions });
}

export function useStatsForDate(date: string) {
  const balance = useDailyBalance(date);
  const profile = usePulseFitStore((s) => s.profile);

  return {
    profile,
    date,
    dayMeals: balance.meals,
    consumed: balance.consumed,
    burned: balance.burned,
    budget: balance.budget,
    remaining: balance.remaining,
    daySession: balance.session,
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
