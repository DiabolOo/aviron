import { INTENSITY_LABELS, intensityTooHighCopy, nf } from '../copy.fr';
import { buildInsight, effectiveMaxHr, hasHr, hrRulesDisabled, pastRuns } from '../helpers';
import {
  INTENSITY_EASY_HR_RATIO,
  INTENSITY_HIGH_HR_RATIO,
  INTENSITY_MIN_RUN_KM,
  INTENSITY_MIN_RUNS,
  INTENSITY_TRIGGER_SHARE_PCT,
  INTENSITY_WARNING_SHARE_PCT,
  INTENSITY_WINDOW_WEEKS,
} from '../thresholds';
import type { InsightRuleDef } from '../types';
import { addDays, shareAboveHr, weekKey } from '../../engine';

export const RULE_ID = 'intensity_too_high';

/**
 * Sur 12 semaines : ≥ 4 courses > 5 km avec FC, dont ≥ 40 % à plus de 80 % de la FC max.
 * FC max effective : configurée, sinon max(observée, Tanaka) ; textes en « environ » si estimée.
 * Null si hasHrDevice vaut false, sans FC max connue ou estimable, ou sans assez de courses avec FC.
 */
export const intensityTooHigh: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    if (hrRulesDisabled(ctx)) return null;
    const resolved = effectiveMaxHr(ctx);
    if (!resolved) return null;
    const { maxHr, approx } = resolved;
    const from = addDays(ctx.today, -(INTENSITY_WINDOW_WEEKS * 7 - 1));
    const runs = pastRuns(ctx).filter(
      (a) => a.date >= from && (a.distanceKm ?? 0) > INTENSITY_MIN_RUN_KM && hasHr(a),
    );
    if (runs.length < INTENSITY_MIN_RUNS) return null;

    const thresholdBpm = maxHr * INTENSITY_HIGH_HR_RATIO;
    const share = shareAboveHr(runs, thresholdBpm, { types: ['run'] });
    if (share.pct < INTENSITY_TRIGGER_SHARE_PCT) return null;

    const thr = Math.round(thresholdBpm);
    const easyBpm = Math.round(maxHr * INTENSITY_EASY_HR_RATIO);
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: weekKey(ctx.today),
      source: 'trend',
      severity: share.pct >= INTENSITY_WARNING_SHARE_PCT ? 'warning' : 'notice',
      copy: intensityTooHighCopy({
        sharePct: share.pct,
        minKm: INTENSITY_MIN_RUN_KM,
        thresholdBpm: thr,
        easyBpm,
        total: share.total,
        weeks: INTENSITY_WINDOW_WEEKS,
        approx,
      }),
      evidence: [
        {
          label: INTENSITY_LABELS.share(INTENSITY_MIN_RUN_KM, thr),
          value: `${share.above} / ${share.total} (${nf(share.pct)} %)`,
          numeric: share.pct,
        },
        { label: INTENSITY_LABELS.maxHr(approx), value: `${maxHr} bpm`, numeric: maxHr },
        { label: INTENSITY_LABELS.easy, value: `${easyBpm} bpm`, numeric: easyBpm },
      ],
      sessionsUsed: share.total,
      minSessions: INTENSITY_MIN_RUNS,
    });
  },
};
