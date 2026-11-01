import { GAP_LABELS, gapResumeCopy } from '../copy.fr';
import { buildInsight, pastActivities } from '../helpers';
import {
  GAP_CONTEXT_WEEKS,
  GAP_LONG_FIRST_SESSION_MIN,
  GAP_MIN_PRIOR_ACTIVITIES,
  GAP_RESUME_MIN_DAYS,
  GAP_RESUME_RATIO,
  GAP_SHORT_MAX_DAYS,
} from '../thresholds';
import type { InsightEvidence, InsightRuleDef } from '../types';
import { addDays, daysBetween } from '../../engine';

export const RULE_ID = 'gap_resume';

const median = (values: number[]): number => {
  const s = [...values].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * ≥ 14 jours depuis la dernière activité (tous sports). Null s'il y a moins de 3 activités enregistrées.
 * Reprise : 70 % de la séance habituelle (durée médiane des séances du même sport sur les 8 semaines
 * avant la coupure) si la coupure dure 14 à 27 jours, 20 minutes au-delà.
 */
export const gapResume: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const acts = pastActivities(ctx);
    if (acts.length < GAP_MIN_PRIOR_ACTIVITIES) return null;
    const last = acts[acts.length - 1];
    const days = daysBetween(last.date, ctx.today);
    if (days < GAP_RESUME_MIN_DAYS) return null;

    const from = addDays(last.date, -(GAP_CONTEXT_WEEKS * 7 - 1));
    const before = acts.filter((a) => a.date >= from);
    const usualMin = Math.round(median(before.filter((a) => a.type === last.type).map((a) => a.durationMin)));
    const relative = days <= GAP_SHORT_MAX_DAYS && usualMin > 0;
    const resumeMin = relative ? Math.round(usualMin * GAP_RESUME_RATIO) : GAP_LONG_FIRST_SESSION_MIN;

    const evidence: InsightEvidence[] = [
      { label: GAP_LABELS.days, value: `${days} j`, numeric: days },
      { label: GAP_LABELS.before(GAP_CONTEXT_WEEKS), value: `${before.length}`, numeric: before.length },
      ...(relative ? [{ label: GAP_LABELS.usual, value: `${usualMin} min`, numeric: usualMin }] : []),
      { label: GAP_LABELS.resume, value: `${resumeMin} min`, numeric: resumeMin },
    ];
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: last.date,
      source: 'recovery',
      severity: 'info',
      copy: gapResumeCopy({
        days,
        lastDate: last.date,
        resumeMin,
        relative: relative ? { ratioPct: Math.round(GAP_RESUME_RATIO * 100), usualMin } : undefined,
      }),
      evidence,
      sessionsUsed: acts.length,
      minSessions: GAP_MIN_PRIOR_ACTIVITIES,
    });
  },
};
