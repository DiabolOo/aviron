import { z } from 'zod';
import {
  ActivitySchema,
  InsightSchema,
  ProfileSchema,
  RaceGoalSchema,
  SplitSchema,
  type Activity,
  type Insight,
  type Profile,
  type Split,
} from '../schemas';

// Entités J3 réutilisées telles quelles (pas de duplication).
export { ActivitySchema, InsightSchema, SplitSchema };
export type { Activity, Insight, Split };

const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ─── DailyMetrics ─────────────────────────────────────────────────────────────

export const DailyMetricsSchema = z.object({
  date: DateStr,
  activityCount: z.number().int().nonnegative(),
  durationMin: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  elevationM: z.number().nonnegative(),
  // TRIMP de Banister quand la FC existe, sinon durée × facteur par sport.
  load: z.number().nonnegative(),
  avgHr: z.number().nonnegative().optional(),
  restingHr: z.number().positive().optional(),
  sleepMin: z.number().nonnegative().optional(),
  hrvMs: z.number().nonnegative().optional(),
  weightKg: z.number().positive().optional(),
  steps: z.number().int().nonnegative().optional(),
});

export type DailyMetrics = z.infer<typeof DailyMetricsSchema>;

// ─── Race ─────────────────────────────────────────────────────────────────────

export const RaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: DateStr,
  activityId: z.string().optional(),
  /** heure de départ « HH:mm[:ss] » (activité liée) */
  startTime: z.string().optional(),
  /** ville de départ (activité liée, géocodée à l'import) */
  startCity: z.string().optional(),
  officialDistanceKm: z.number().positive(),
  measuredDistanceKm: z.number().positive().optional(),
  timeSec: z.number().positive().optional(),
  targetTime: RaceGoalSchema.shape.targetTime,
  goalId: RaceGoalSchema.shape.id.optional(),
  status: z.enum(['upcoming', 'completed']),
});

export type Race = z.infer<typeof RaceSchema>;
export type RaceGoal = z.infer<typeof RaceGoalSchema>;

// ─── AthleteProfile ───────────────────────────────────────────────────────────

export const AthleteProfileSchema = z.object({
  ageYears: ProfileSchema.shape.ageYears,
  sex: ProfileSchema.shape.sex,
  weightKg: ProfileSchema.shape.weightKg.optional(),
  mainSport: ProfileSchema.shape.mainSport,
  // 'estimated' = Tanaka : 208 − 0,7 × âge
  maxHr: z.number().int().min(100).max(230).optional(),
  maxHrSource: z.enum(['observed', 'configured', 'estimated']).optional(),
  restingHr: z.number().int().min(25).max(120).optional(),
  // Réponse « montre ou capteur cardiaque » de l'onboarding ; false = les règles basées sur la FC se taisent.
  hasHrDevice: z.boolean().optional(),
  athleticGoal: ProfileSchema.shape.athleticGoal,
  // level (expérience d'entraînement) ≠ activityLevel (dépense quotidienne, pour les calories).
  level: z.enum(['beginner', 'regular', 'advanced']).default('beginner'),
});

export type AthleteProfile = z.infer<typeof AthleteProfileSchema>;
export type AthleteBaseProfile = Pick<Profile, 'ageYears' | 'sex' | 'weightKg' | 'mainSport'>;

// ─── TrainingInsight (Insight J3 enrichi) ─────────────────────────────────────

export const InsightSeveritySchema = z.enum(['info', 'notice', 'warning']);

export const TrainingInsightSchema = InsightSchema.extend({
  ruleId: z.string(),
  severity: InsightSeveritySchema,
  title: z.string().min(1),
  beginnerText: z.string(),
  athleteText: z.string(),
  evidence: z.array(z.object({ label: z.string(), value: z.string(), numeric: z.number().optional() })),
  why: z.string(),
});

export type InsightSeverity = z.infer<typeof InsightSeveritySchema>;
export type TrainingInsight = z.infer<typeof TrainingInsightSchema>;
