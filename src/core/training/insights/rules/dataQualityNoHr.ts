import { dataQualityNoHrCopy, dateFr, EVIDENCE_LABELS } from '../copy.fr';
import { buildInsight, hasHr, hrRulesDisabled, pastActivities, pastRuns } from '../helpers';
import { NO_HR_MIN_HR_SESSIONS, NO_HR_MIN_MISSING, NO_HR_WINDOW_RUNS } from '../thresholds';
import type { InsightRuleDef } from '../types';

export const RULE_ID = 'data_quality_no_hr';

/**
 * ≥ 3 des 5 dernières courses sans FC. Null pour un débutant (level 'beginner'), si hasHrDevice vaut false,
 * s'il y a moins de 5 courses ou si l'historique compte moins de 5 séances avec FC (pas de mesure à « perdre » :
 * un appareil sans capteur n'est pas un problème de données). Refus permanent : rankInsights({ rejectedForever }).
 * periodKey = date de la dernière séance avec FC.
 */
export const dataQualityNoHr: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    if (ctx.profile.level === 'beginner' || hrRulesDisabled(ctx)) return null;
    const runs = pastRuns(ctx);
    if (runs.length < NO_HR_WINDOW_RUNS) return null;
    const missing = runs.slice(-NO_HR_WINDOW_RUNS).filter((a) => !hasHr(a)).length;
    if (missing < NO_HR_MIN_MISSING) return null;

    const withHr = pastActivities(ctx).filter(hasHr);
    if (withHr.length < NO_HR_MIN_HR_SESSIONS) return null;
    const lastWithHr = withHr[withHr.length - 1];
    const since = lastWithHr.date;
    const streak = runs.filter((a) => a.date >= since && !hasHr(a)).length;

    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: since,
      source: 'trend',
      severity: 'notice',
      copy: dataQualityNoHrCopy({ missing, window: NO_HR_WINDOW_RUNS, streak, since }),
      evidence: [
        { label: EVIDENCE_LABELS.noHrMissing(NO_HR_WINDOW_RUNS), value: `${missing} / ${NO_HR_WINDOW_RUNS}`, numeric: missing },
        { label: EVIDENCE_LABELS.noHrStreak, value: `${streak} depuis le ${dateFr(since)}`, numeric: streak },
      ],
      sessionsUsed: NO_HR_WINDOW_RUNS,
      minSessions: NO_HR_WINDOW_RUNS,
    });
  },
};
