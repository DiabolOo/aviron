import { GAP_LABELS, gapResumeCopy } from '../copy.fr';
import { buildInsight, pastActivities } from '../helpers';
import { GAP_CONTEXT_WEEKS, GAP_FIRST_SESSION_MIN, GAP_MIN_PRIOR_ACTIVITIES, GAP_RESUME_MIN_DAYS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { addDays, daysBetween } from '../../engine';

export const RULE_ID = 'gap_resume';

/** ≥ 14 jours depuis la dernière activité (tous sports). Null s'il y a moins de 3 activités enregistrées. */
export const gapResume: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const acts = pastActivities(ctx);
    if (acts.length < GAP_MIN_PRIOR_ACTIVITIES) return null;
    const last = acts[acts.length - 1];
    const days = daysBetween(last.date, ctx.today);
    if (days < GAP_RESUME_MIN_DAYS) return null;

    const from = addDays(last.date, -(GAP_CONTEXT_WEEKS * 7 - 1));
    const before = acts.filter((a) => a.date >= from).length;
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: last.date,
      source: 'recovery',
      severity: 'info',
      copy: gapResumeCopy({ days, lastDate: last.date, firstSessionMin: GAP_FIRST_SESSION_MIN }),
      evidence: [
        { label: GAP_LABELS.days, value: `${days} j`, numeric: days },
        { label: GAP_LABELS.before(GAP_CONTEXT_WEEKS), value: `${before}`, numeric: before },
      ],
      sessionsUsed: acts.length,
      minSessions: GAP_MIN_PRIOR_ACTIVITIES,
    });
  },
};
