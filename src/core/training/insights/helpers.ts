import type { Activity } from '../../schemas';
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

/** FC max : configurée / observée, sinon estimée par Tanaka (âge) ; undefined si rien n'est connu. */
export function resolveMaxHr(ctx: InsightContext, estimate: (age: number) => number): number | undefined {
  if (ctx.profile.maxHr) return ctx.profile.maxHr;
  return ctx.profile.ageYears ? estimate(ctx.profile.ageYears) : undefined;
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
