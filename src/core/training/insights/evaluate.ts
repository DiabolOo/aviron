import { addDays } from '../engine';
import type { TrainingInsight } from '../types';
import { INSIGHT_RULES } from './rules';
import { INSIGHT_MUTE_DAYS } from './thresholds';
import type { InsightContext } from './types';

const SEVERITY_RANK: Record<TrainingInsight['severity'], number> = { warning: 3, notice: 2, info: 1 };

/** Une règle qui se déclenche en masque d'autres (ex. une reprise après coupure rend le bilan de régularité hors sujet). */
const SUPPRESSES: Record<string, readonly string[]> = { gap_resume: ['consistency'] };

/** Applique toutes les règles, dans l'ordre du registre ; ignore celles qui renvoient null. */
export function evaluateInsights(ctx: InsightContext): TrainingInsight[] {
  const out: TrainingInsight[] = [];
  for (const rule of INSIGHT_RULES) {
    const insight = rule.evaluate(ctx);
    if (insight) out.push(insight);
  }
  const suppressed = new Set(out.flatMap((i) => SUPPRESSES[i.ruleId] ?? []));
  return out.filter((i) => !suppressed.has(i.ruleId));
}

export interface InsightRejection {
  /** id de l'insight rejeté (`${ruleId}:${periodKey}`) */
  insightId: string;
  /** YYYY-MM-DD */
  rejectedAt: string;
}

/** `ruleId` d'un id d'insight : `${ruleId}:${periodKey}`. */
export const ruleIdOf = (insightId: string): string => insightId.split(':')[0];

/** Règles masquées par un rejet des 28 derniers jours, quel que soit l'id (période) rejeté. */
export function computeMutedRuleIds(rejections: readonly InsightRejection[], today: string): Set<string> {
  const since = addDays(today, -INSIGHT_MUTE_DAYS);
  return new Set(rejections.filter((r) => r.rejectedAt > since && r.rejectedAt <= today).map((r) => ruleIdOf(r.insightId)));
}

export interface RankOptions {
  max?: number;
  /** ids déjà montrés à l'utilisateur : les nouveaux passent devant à gravité égale */
  seenIds?: ReadonlySet<string>;
  /** règles masquées (voir `computeMutedRuleIds`) : retirées quel que soit l'id de l'insight */
  mutedRuleIds?: ReadonlySet<string>;
}

/**
 * Tri par gravité, puis nouveauté (id non vu, puis date récente), puis ordre des règles ;
 * règles masquées retirées ; une seule carte par ruleId ; au plus `max` (3 par défaut).
 */
export function rankInsights(list: readonly TrainingInsight[], opts: RankOptions = {}): TrainingInsight[] {
  const max = opts.max ?? 3;
  const seen = opts.seenIds;
  const sorted = list
    .filter((insight) => !opts.mutedRuleIds?.has(insight.ruleId))
    .map((insight, index) => ({ insight, index }))
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.insight.severity] - SEVERITY_RANK[a.insight.severity] ||
        Number(seen?.has(a.insight.id) ?? false) - Number(seen?.has(b.insight.id) ?? false) ||
        b.insight.date.localeCompare(a.insight.date) ||
        a.index - b.index,
    );
  const ruleIds = new Set<string>();
  const out: TrainingInsight[] = [];
  for (const { insight } of sorted) {
    if (ruleIds.has(insight.ruleId)) continue;
    ruleIds.add(insight.ruleId);
    out.push(insight);
    if (out.length >= max) break;
  }
  return out;
}
