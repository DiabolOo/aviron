import { dateFr, dataQualityNoHrCopy, EVIDENCE_LABELS } from '../copy.fr';
import { buildInsight, hasHr, pastRuns } from '../helpers';
import { NO_HR_MIN_MISSING, NO_HR_WINDOW_RUNS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { weekKey } from '../../engine';

export const RULE_ID = 'data_quality_no_hr';

/** ≥ 3 des 5 dernières courses sans FC. Null s'il y a moins de 5 courses. */
export const dataQualityNoHr: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const runs = pastRuns(ctx);
    if (runs.length < NO_HR_WINDOW_RUNS) return null;
    const missing = runs.slice(-NO_HR_WINDOW_RUNS).filter((a) => !hasHr(a)).length;
    if (missing < NO_HR_MIN_MISSING) return null;

    // Série en cours : courses consécutives sans FC depuis la dernière course avec FC.
    let streak = 0;
    while (streak < runs.length && !hasHr(runs[runs.length - 1 - streak])) streak++;
    const lastWithHr = streak < runs.length ? runs[runs.length - 1 - streak] : undefined;
    const since = (lastWithHr ?? runs[0]).date;

    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: weekKey(ctx.today),
      source: 'coach',
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
