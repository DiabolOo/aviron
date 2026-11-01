import type { Activity } from '../../schemas';
import type { RaceCandidate } from '../engine';
import type { AthleteProfile, InsightSeverity, TrainingInsight } from '../types';

export interface InsightContext {
  /** jour courant, YYYY-MM-DD — jamais `new Date()` : les règles restent pures et testables */
  today: string;
  activities: Activity[];
  profile: AthleteProfile;
  /** courses candidates ou à venir ; les règles de course ne retiennent que celles de confiance 'high' */
  races: RaceCandidate[];
}

/** Renvoie null si les données sont insuffisantes (jamais de chiffre approximatif). */
export type InsightRule = (ctx: InsightContext) => TrainingInsight | null;

export interface InsightRuleDef {
  ruleId: string;
  evaluate: InsightRule;
}

export interface InsightCopy {
  /** 8 mots maximum */
  title: string;
  /** 2 phrases maximum, sans jargon */
  beginnerText: string;
  /** 2 phrases maximum, avec les chiffres */
  athleteText: string;
  /** 2 à 3 phrases */
  why: string;
}

export interface InsightEvidence {
  label: string;
  value: string;
  numeric: number;
}

export interface BuildInsightInput {
  ctx: InsightContext;
  ruleId: string;
  /** clé de période stable (semaine ISO, id de course…) : id = `${ruleId}:${periodKey}` */
  periodKey: string;
  source: TrainingInsight['source'];
  severity: InsightSeverity;
  copy: InsightCopy;
  evidence: InsightEvidence[];
  /** séances réellement utilisées pour le calcul */
  sessionsUsed: number;
  /** minimum de séances requis par la règle */
  minSessions: number;
}
