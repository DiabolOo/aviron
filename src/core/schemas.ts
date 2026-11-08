import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

export const MacrosSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const AthleticGoalSchema = z.object({
  type: z.enum(['race_prep', 'muscle_strength', 'endurance', 'fitness']),
  targetName: z.string(),
  targetValue: z.string().optional(),
  targetDate: z.string().optional(),
  weeklySessionsCount: z.number().int().min(1).max(14),
});

/** Niveau déclaré à l'onboarding (étape 1) : « Je débute · Je cours un peu · Je m'entraîne ». */
export const DeclaredLevelSchema = z.enum(['beginner', 'regular', 'advanced']);
/** Équipement déclaré à l'onboarding (étape 2) : montre avec cardio, téléphone, rien. */
export const EquipmentSchema = z.enum(['hrWatch', 'phone', 'none']);

export const ProfileSchema = z.object({
  firstName: z.string().min(1),
  sex: z.enum(['male', 'female', 'other']).optional(),
  ageYears: z.number().int().min(10).max(120).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  weightKg: z.number().min(20).max(500),
  targetWeightKg: z.number().min(20).max(500),
  weeklyPaceKg: z.number().min(0).max(2).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'active', 'athlete']).optional(),
  mainSport: z.enum(['running', 'strength', 'cycling', 'triathlon', 'fitness']).optional(),
  goal: z.enum(['weight_loss', 'maintenance', 'muscle_gain']).optional(),
  goalLabel: z.string(),
  athleticGoal: AthleticGoalSchema.optional(),
  /** FC max saisie par l'utilisateur — prioritaire sur l'observée et l'estimée */
  maxHr: z.number().int().min(100).max(230).optional(),
  level: DeclaredLevelSchema.optional(),
  equipment: EquipmentSchema.optional(),
  calorieTarget: z.number().positive(),
  macrosTarget: MacrosSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;

// ─── Meal & FoodItem ──────────────────────────────────────────────────────────

export const FoodItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  portionG: z.number().positive(),
  macrosPer100g: MacrosSchema,
});

export type FoodItem = z.infer<typeof FoodItemSchema>;

export const MealSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  loggedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)),
  macros: MacrosSchema,
  photoUri: z.string().optional(),
  confidence: z.number().min(0).max(1),
  items: z.array(FoodItemSchema).optional(),
});

export type Meal = z.infer<typeof MealSchema>;

// ─── Activity ─────────────────────────────────────────────────────────────────

export const SplitSchema = z.object({
  km: z.number().nonnegative(),
  pace: z.string(),
  paceSec: z.number().nonnegative(),
  /** allure sur le temps écoulé (arrêts compris) — le chrono des courses ; absente si inconnue */
  elapsedPaceSec: z.number().nonnegative().optional(),
  elevationGain: z.number(),
  avgHr: z.number().nonnegative().optional(),
});

export type Split = z.infer<typeof SplitSchema>;

export const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['run', 'ride', 'walk', 'swim', 'strength', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  durationMin: z.number().nonnegative(),
  /** temps de déplacement (sans pauses) — l'allure affichée s'appuie dessus */
  movingTimeSec: z.number().positive().optional(),
  distanceKm: z.number().nonnegative().optional(),
  /** distance brute de la trace (GPS/FIT) — peut différer du CSV Strava */
  traceDistanceKm: z.number().positive().optional(),
  /** ville de départ — courses uniquement (géocodée à l'import, aucune coordonnée stockée ;
   *  exclue des résumés envoyés au coach IA, voir ADR-004) */
  startCity: z.string().optional(),
  elevationM: z.number().nonnegative().optional(),
  calories: z.number().nonnegative().optional(),
  avgHr: z.number().nonnegative().optional(),
  maxHr: z.number().nonnegative().optional(),
  /** Canal d'import — détermine `aiEligible`. 'strava' ⇒ aiEligible false, sans exception. */
  source: z.enum(['strava', 'coros', 'garmin', 'apple_health', 'health_connect', 'file', 'phone', 'manual']),
  /** Vrai si l'activité peut être incluse dans un résumé envoyé à l'IA. Invariant : source 'strava' ⇒ false. */
  aiEligible: z.boolean(),
  /** Fabricant lu dans le fichier FIT (champ manufacturer de file_id) — affichage seulement, sans effet sur aiEligible. */
  device: z.string().optional(),
  splits: z.array(SplitSchema).optional(),
  hrStream: z.array(z.number()).optional(),
  polyline: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

export type Activity = z.infer<typeof ActivitySchema>;

// ─── PlannedWorkout ───────────────────────────────────────────────────────────

export const PlannedWorkoutSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  kind: z.enum(['run', 'strength', 'rest', 'other']),
  subtitle: z.string(),
  durationMin: z.number().nonnegative(),
  targetCaloriesBurn: z.number().nonnegative(),
  completed: z.boolean(),
  linkedActivityId: z.string().optional(),
  blocks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    detail: z.string(),
    durationMin: z.number().nonnegative().optional(),
  })).optional(),
  exercises: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sets: z.number().int().nonnegative(),
    reps: z.string(),
    restSec: z.number().nonnegative(),
  })).optional(),
});

export type PlannedWorkout = z.infer<typeof PlannedWorkoutSchema>;

// ─── Goal ─────────────────────────────────────────────────────────────────────

export const RaceGoalSchema = z.object({
  type: z.literal('race'),
  id: z.string(),
  name: z.string(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetTime: z.string().optional(),
  distanceKm: z.number().positive().optional(),
});

export const GoalSchema = z.discriminatedUnion('type', [
  RaceGoalSchema,
  z.object({
    type: z.literal('weight'),
    id: z.string(),
    targetWeightKg: z.number().positive(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    weeklyPaceKg: z.number().min(0).max(2).optional(),
  }),
  z.object({
    type: z.literal('habit'),
    id: z.string(),
    name: z.string(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    weeklyFrequency: z.number().int().min(1).max(7).optional(),
  }),
]);

export type Goal = z.infer<typeof GoalSchema>;

// ─── TrainingPlan ─────────────────────────────────────────────────────────────

export const TrainingSessionSchema = z.object({
  dayOffset: z.number().int(),
  title: z.string(),
  kind: z.enum(['run', 'strength', 'rest', 'other']),
  durationMin: z.number().nonnegative(),
  intensityZone: z.number().int().min(1).max(5).optional(),
  paceTarget: z.string().optional(),
  notes: z.string().optional(),
});

export const TrainingWeekSchema = z.object({
  weekIndex: z.number().int().nonnegative(),
  theme: z.string().optional(),
  sessions: z.array(TrainingSessionSchema),
  totalVolumeKm: z.number().nonnegative().optional(),
  totalDurationMin: z.number().nonnegative().optional(),
});

export const TrainingPlanSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  goalId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalWeeks: z.number().int().min(1).max(52),
  weeks: z.array(TrainingWeekSchema),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
});

export type TrainingPlan = z.infer<typeof TrainingPlanSchema>;

// ─── Insight ──────────────────────────────────────────────────────────────────

export const InsightSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['coach', 'nutrition', 'recovery', 'trend']),
  message: z.string(),
  detail: z.string().optional(),
  confidence: z.number().min(0).max(1),
  linkedGoalId: z.string().optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// ─── Proposal ────────────────────────────────────────────────────────────────

export const ProposalStatusSchema = z.enum([
  'pending',
  'accepted',
  'edited',
  'rejected',
  'undone',
]);

export const ProposalActionSchema = z.enum([
  'adjust_plan',
  'log_meal',
  'adjust_nutrition_targets',
  'plan_week_meals',
  'create_program',
]);

export const ProposalSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  title: z.string().min(1),
  source: z.enum(['coach', 'nutrition', 'agent']).default('agent'),
  action: ProposalActionSchema,
  payload: z.record(z.string(), z.unknown()),
  status: ProposalStatusSchema,
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  autoApply: z.boolean().default(false),
  preview: z.object({ before: z.string().optional(), after: z.string() }).optional(),
  editedPayload: z.record(z.string(), z.unknown()).optional(),
  resolvedAt: z.string().optional(),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

// ─── DailyBrief ───────────────────────────────────────────────────────────────

export const DailyBriefSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatedAt: z.string(),
  summary: z.string(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    priority: z.number().int().min(1).max(3),
  })),
  kcalTarget: z.number().positive(),
  macroAdjust: MacrosSchema.partial().optional(),
  insights: z.array(InsightSchema).optional(),
});

export type DailyBrief = z.infer<typeof DailyBriefSchema>;

// ─── Recipe ───────────────────────────────────────────────────────────────────

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  prepTimeMinutes: z.number().nonnegative().optional(),
  category: z.enum(['weight_loss', 'muscle_gain', 'quick', 'recovery', 'custom']),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })).optional(),
  isFavorite: z.boolean().optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// ─── Weather ─────────────────────────────────────────────────────────────────

export const WeatherSchema = z.object({
  city: z.string(),
  tempC: z.number(),
  condition: z.enum(['sunny', 'cloudy', 'partly', 'rain']),
});

export type Weather = z.infer<typeof WeatherSchema>;
