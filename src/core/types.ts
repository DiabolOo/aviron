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
  weeklyPaceKg?: number;
  goalLabel: string;
  athleticGoal?: AthleticGoal;
  /** FC max saisie — sinon l'app retombe sur l'observée (12 mois) puis l'estimation par l'âge */
  maxHr?: number;
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

// Mêmes valeurs que Activity['type'] (schemas.ts) : ne pas restreindre,
// le snapshot Strava contient des nages, de la muscu ('other'), etc.
export type ActivityType = 'run' | 'ride' | 'walk' | 'swim' | 'strength' | 'other';

// Les champs optionnels restent undefined quand la donnée est absente :
// jamais de 0 à l'affichage.
export type StravaActivity = {
  id: string;
  name: string;
  type: ActivityType;
  date: string;
  startTime: string;
  distanceKm?: number;
  /** temps écoulé (pauses incluses) */
  durationMin: number;
  /** temps de déplacement — sert l'allure/vitesse affichée quand il existe */
  movingTimeMin?: number;
  /** temps de déplacement exact (secondes) — priorité sur movingTimeMin */
  movingTimeSec?: number;
  elevationM?: number;
  calories?: number;
  avgHr?: number;
  maxHr?: number;
  /** ville de départ — courses uniquement (import Strava, ADR-004) */
  startCity?: string;
  splits: ActivitySplit[];
  hrStream: number[];
  polyline: RoutePoint[];
};

export type ActivitySplit = {
  km: number;
  pace: string;
  paceSec: number;
  elapsedPaceSec?: number;
  elevationGain: number;
  avgHr?: number;
};

export type RoutePoint = { x: number; y: number };

export type ScanStep = 'idle' | 'analyzing' | 'result' | 'error';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AthleticGoalType = 'race_prep' | 'muscle_strength' | 'endurance' | 'fitness';

export type AthleticGoal = {
  type: AthleticGoalType;
  targetName: string;
  targetValue?: string;
  targetDate?: string;
  weeklySessionsCount: number;
};

export type ProgramMilestone = {
  id: string;
  title: string;
  date: string;
  weekIndex: number;
};

export type WorkoutProgram = {
  id: string;
  createdAt: string;
  goal: AthleticGoal;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  milestones: ProgramMilestone[];
};
