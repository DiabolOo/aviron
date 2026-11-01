import type { Activity } from '../../schemas';
import { estimateMaxHr, type RaceCandidate } from '../engine';
import { TrainingInsightSchema, type TrainingInsight } from '../types';
import type { BuildInsightInput, InsightContext } from './types';

export const hasHr = (a: Activity): boolean => a.avgHr !== undefined && a.avgHr > 0;

/** Activités jusqu'à `today` inclus, de la plus ancienne à la plus récente. */
export function pastActivities(ctx: InsightContext): Activity[] {
  return ctx.activities
    .filter((a) => a.date <= ctx.today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export const pastRuns = (ctx: InsightContext): Activity[] => pastActivities(ctx).filter((a) => a.type === 'run');

export const round1 = (n: number): number => Math.round(n * 10) / 10;

/** min(1, séances utilisées / (2 × minimum requis)) */
export function insightConfidence(sessionsUsed: number, minSessions: number): number {
  return Math.min(1, sessionsUsed / (2 * minSessions));
}

/** Course confirmée par l'utilisateur (confirmedIds) ou déclarée (objectif). */
export function isConfirmedRace(ctx: InsightContext, race: RaceCandidate): boolean {
  const ids = ctx.confirmedIds ?? [];
  return race.goalId !== undefined || ids.includes(race.id) || (race.activityId !== undefined && ids.includes(race.activityId));
}

export interface EffectiveMaxHr {
  maxHr: number;
  /** vrai si la valeur est estimée (Tanaka) : les textes disent « environ » */
  approx: boolean;
}

/**
 * FC max effective : valeur configurée telle quelle ; sinon max(observée, Tanaka).
 * Undefined si ni FC max ni âge ne sont connus.
 */
export function effectiveMaxHr(ctx: InsightContext): EffectiveMaxHr | undefined {
  const { maxHr, maxHrSource, ageYears } = ctx.profile;
  if (maxHr && maxHrSource === 'configured') return { maxHr, approx: false };
  const tanaka = ageYears ? estimateMaxHr(ageYears) : undefined;
  if (maxHr && (tanaka === undefined || maxHr >= tanaka)) return { maxHr, approx: maxHrSource === 'estimated' };
  return tanaka === undefined ? undefined : { maxHr: tanaka, approx: true };
}

/** « 1:45:00 », « 1:45 » (h:mm), « 1h45 », « 1h45m » → secondes ; undefined si illisible. */
export function parseTargetTime(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const t = text.trim().toLowerCase();
  const hm = t.match(/^(\d+)\s*h\s*(\d{1,2})?\s*(?:m|min)?$/);
  if (hm) return Number(hm[1]) * 3600 + Number(hm[2] ?? 0) * 60;
  const parts = t.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p))) return undefined;
  return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 3600 + parts[1] * 60;
}

export function buildInsight(input: BuildInsightInput): TrainingInsight {
  const { ctx, ruleId, periodKey, copy } = input;
  return TrainingInsightSchema.parse({
    id: `${ruleId}:${periodKey}`,
    date: ctx.today,
    source: input.source,
    message: ctx.profile.level === 'beginner' ? copy.beginnerText : copy.athleteText,
    confidence: insightConfidence(input.sessionsUsed, input.minSessions),
    ruleId,
    severity: input.severity,
    title: copy.title,
    beginnerText: copy.beginnerText,
    athleteText: copy.athleteText,
    evidence: input.evidence,
    why: copy.why,
  });
}
