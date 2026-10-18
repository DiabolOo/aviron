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

export type UserProfile = {
  firstName: string;
  goalLabel: string;
  calorieTarget: number;
  macrosTarget: Omit<Macros, 'calories'> & { calories: number };
  weightKg: number;
  targetWeightKg: number;
};

export type MealMoment = 'morning' | 'noon' | 'snack' | 'evening';

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
};

export type ScanStep = 'idle' | 'analyzing' | 'result';

export type FatigueLevel = 'fresh' | 'ok' | 'tired';
export type TimeBudget = '30' | '45' | '60' | '90';

export type ThemePreference = 'system' | 'light' | 'dark';
