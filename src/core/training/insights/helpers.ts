import type { Activity } from '../../schemas';
import { estimateMaxHr, type RaceCandidate } from '../engine';
import { TrainingInsightSchema, type TrainingInsight } from '../types';
import { TARGET_PACE_MAX_SEC, TARGET_PACE_MIN_SEC, TARGET_TIME_HM_MIN_KM } from './thresholds';
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

/**
 * Temps visé → secondes ; undefined si illisible.
 * « 1h45 », « 1h45m », « 1:45:00 » sont sans ambiguïté. « a:b » est tranché selon la distance :
 * h:mm à partir de 15 km (semi, marathon), mm:ss en dessous (5 et 10 km).
 */
export function parseTargetTime(text: string | undefined, raceKm: number): number | undefined {
  if (!text) return undefined;
  const t = text.trim().toLowerCase();
  const hm = t.match(/^(\d+)\s*h\s*(\d{1,2})?\s*(?:m|min)?$/);
  if (hm) return Number(hm[1]) * 3600 + Number(hm[2] ?? 0) * 60;
  if (!/^\d+(:\d{1,2}){1,2}$/.test(t)) return undefined;
  const p = t.split(':').map(Number);
  if (p.slice(1).some((x) => x >= 60)) return undefined;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  return raceKm >= TARGET_TIME_HM_MIN_KM ? p[0] * 3600 + p[1] * 60 : p[0] * 60 + p[1];
}

/** Allure visée (s/km) ; undefined si le temps est illisible ou si l'allure sort de 2:30–10:00 par km. */
export function targetPaceSec(text: string | undefined, raceKm: number): number | undefined {
  const total = parseTargetTime(text, raceKm);
  if (total === undefined || raceKm <= 0) return undefined;
  const pace = Math.round(total / raceKm);
  return pace >= TARGET_PACE_MIN_SEC && pace <= TARGET_PACE_MAX_SEC ? pace : undefined;
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
