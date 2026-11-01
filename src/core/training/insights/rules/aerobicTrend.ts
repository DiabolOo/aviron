import { AEROBIC_LABELS, aerobicTrendCopy, nf } from '../copy.fr';
import { buildInsight, pastRuns, round1 } from '../helpers';
import { AEROBIC_TREND_MIN_PCT, AEROBIC_TREND_MIN_SESSIONS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { aerobicEfficiency, quarterKey } from '../../engine';

export const RULE_ID = 'aerobic_trend';

function previousQuarter(key: string): string {
  const [y, q] = key.split('-Q').map(Number);
  return q === 1 ? `${y - 1}-Q4` : `${y}-Q${q - 1}`;
}

/**
 * Gravité 'info' dans les deux sens (une baisse a plusieurs causes possibles, sans prescription).
 * Variation d'efficacité aérobie ≥ 5 % entre le trimestre courant (ou le précédent s'il n'est pas
 * encore fiable) et le trimestre qui le précède. Null si l'un des deux n'est pas `reliable`.
 */
export const aerobicTrend: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const quarters = aerobicEfficiency(pastRuns(ctx), { types: ['run'] });
    const byKey = new Map(quarters.map((q) => [q.quarter, q]));
    const current = quarterKey(ctx.today);
    const latestKey = [current, previousQuarter(current)].find((k) => byKey.get(k)?.reliable);
    if (!latestKey) return null;
    const latest = byKey.get(latestKey)!;
    const base = byKey.get(previousQuarter(latestKey));
    if (!base?.reliable || latest.ef === undefined || base.ef === undefined) return null;

    const variation = round1((latest.ef / base.ef - 1) * 100);
    if (Math.abs(variation) < AEROBIC_TREND_MIN_PCT) return null;

    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: latestKey,
      source: 'trend',
      severity: 'info',
      copy: aerobicTrendCopy({ variationPct: variation, latest: latestKey, base: base.quarter }),
      evidence: [
        { label: AEROBIC_LABELS.efficiency(latestKey), value: nf(latest.ef, 3), numeric: latest.ef },
        { label: AEROBIC_LABELS.efficiency(base.quarter), value: nf(base.ef, 3), numeric: base.ef },
        { label: AEROBIC_LABELS.variation, value: `${variation > 0 ? '+' : '−'}${nf(Math.abs(variation), 1)} %`, numeric: variation },
      ],
      sessionsUsed: latest.sessions + base.sessions,
      minSessions: AEROBIC_TREND_MIN_SESSIONS,
    });
  },
};
