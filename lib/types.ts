export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WorkoutKind = 'run' | 'strength' | 'rest';

export type WorkoutBlock = {
  id: string;
  title: string;
  detail: string;
  durationMin?: number;
};

export type StrengthExercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
};

export type WorkoutSession = {
  id: string;
  date: string;
  title: string;
  kind: WorkoutKind;
  subtitle: string;
  durationMin: number;
  caloriesBurn: number;
  completed: boolean;
  blocks?: WorkoutBlock[];
  exercises?: StrengthExercise[];
};

export type Meal = {
  id: string;
  name: string;
  loggedAt: string;
  macros: Macros;
  photoUri?: string;
  confidence: number;
};

export type Sex = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'active' | 'athlete';

export type NutritionGoal = 'weight_loss' | 'maintenance' | 'muscle_gain';

export type MainSport = 'running' | 'strength' | 'cycling' | 'triathlon' | 'fitness';

export type UserProfile = {
  firstName: string;
  mainSport?: MainSport;
  sex?: Sex;
  ageYears?: number;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  goalLabel: string;
  calorieTarget: number;
  macrosTarget: Omit<Macros, 'calories'> & { calories: number };
  weightKg: number;
  targetWeightKg: number;
};

export type MealMoment = 'morning' | 'noon' | 'snack' | 'evening';

export type RecipeMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type RecipeCategory = 'weight_loss' | 'muscle_gain' | 'quick' | 'recovery' | 'custom';

export type Recipe = {
  id: string;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes?: number;
  category: RecipeCategory;
  ingredients?: { name: string; quantity: string }[];
  isFavorite?: boolean;
};

export type WeatherCondition = 'sunny' | 'cloudy' | 'partly' | 'rain';

export type Weather = {
  city: string;
  tempC: number;
  condition: WeatherCondition;
};

export type ActivityType = 'run' | 'ride' | 'walk';

export type StravaActivity = {
  id: string;
  name: string;
  type: ActivityType;
  date: string;
  distanceKm: number;
  movingTimeMin: number;
  elevationM: number;
  startTime: string;
  calories: number;
  avgHr: number;
  maxHr: number;
  splits: ActivitySplit[];
  hrStream: number[];
  polyline: RoutePoint[];
};

export type ActivitySplit = {
  km: number;
  pace: string;
  paceSec: number;
  elevationGain: number;
  avgHr: number;
};

export type RoutePoint = { x: number; y: number };

export type ScanStep = 'idle' | 'analyzing' | 'result' | 'error';

export type FatigueLevel = 'fresh' | 'ok' | 'tired';
export type TimeBudget = '30' | '45' | '60' | '90';

export type ThemePreference = 'system' | 'light' | 'dark';
