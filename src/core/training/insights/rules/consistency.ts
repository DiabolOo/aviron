import { CONSISTENCY_LABELS, consistencyCopy, type ConsistencyTier } from '../copy.fr';
import { buildInsight, pastActivities } from '../helpers';
import { CONSISTENCY_GOOD_WEEKS, CONSISTENCY_MIN_SESSIONS, CONSISTENCY_WINDOW_WEEKS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { addDays, weekKey } from '../../engine';

export const RULE_ID = 'consistency';

/**
 * Semaines actives (≥ 1 activité, tous sports) sur les 8 dernières semaines glissantes de 7 jours.
 * Null si l'historique ne couvre pas les 8 semaines ou si la fenêtre compte moins de 3 séances.
 */
export const consistency: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const acts = pastActivities(ctx);
    const windowStart = addDays(ctx.today, -(CONSISTENCY_WINDOW_WEEKS * 7 - 1));
    if (!acts.length || acts[0].date > windowStart) return null;
    const inWindow = acts.filter((a) => a.date >= windowStart);
    if (inWindow.length < CONSISTENCY_MIN_SESSIONS) return null;

    const active = new Set(inWindow.map((a) => Math.floor((Date.parse(a.date) - Date.parse(windowStart)) / (7 * 86400000)))).size;
    const tier: ConsistencyTier = active >= CONSISTENCY_GOOD_WEEKS ? 'good' : active >= 3 ? 'building' : 'restart';
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: weekKey(ctx.today),
      source: 'trend',
      severity: 'info',
      copy: consistencyCopy({ tier, active, window: CONSISTENCY_WINDOW_WEEKS, sessions: inWindow.length }),
      evidence: [
        { label: CONSISTENCY_LABELS.active(CONSISTENCY_WINDOW_WEEKS), value: `${active} / ${CONSISTENCY_WINDOW_WEEKS}`, numeric: active },
        { label: CONSISTENCY_LABELS.sessions(CONSISTENCY_WINDOW_WEEKS), value: `${inWindow.length}`, numeric: inWindow.length },
      ],
      sessionsUsed: inWindow.length,
      minSessions: CONSISTENCY_MIN_SESSIONS,
    });
  },
};
