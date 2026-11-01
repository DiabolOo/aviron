import type { TrainingInsight } from '../types';
import { INSIGHT_RULES } from './rules';
import type { InsightContext } from './types';

const SEVERITY_RANK: Record<TrainingInsight['severity'], number> = { warning: 3, notice: 2, info: 1 };

/** Applique toutes les règles, dans l'ordre du registre ; ignore celles qui renvoient null. */
export function evaluateInsights(ctx: InsightContext): TrainingInsight[] {
  const out: TrainingInsight[] = [];
  for (const rule of INSIGHT_RULES) {
    const insight = rule.evaluate(ctx);
    if (insight) out.push(insight);
  }
  return out;
}

export interface RankOptions {
  max?: number;
  /** ids déjà montrés à l'utilisateur : les nouveaux passent devant à gravité égale */
  seenIds?: ReadonlySet<string>;
}

/**
 * Tri par gravité, puis nouveauté (id non vu, puis date récente), puis ordre des règles ;
 * une seule carte par ruleId ; au plus `max` (3 par défaut).
 */
export function rankInsights(list: readonly TrainingInsight[], opts: RankOptions = {}): TrainingInsight[] {
  const max = opts.max ?? 3;
  const seen = opts.seenIds;
  const sorted = list
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
