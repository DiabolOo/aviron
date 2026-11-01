import { INTENSITY_LABELS, intensityTooHighCopy, nf } from '../copy.fr';
import { buildInsight, hasHr, pastRuns, resolveMaxHr } from '../helpers';
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
import { addDays, estimateMaxHr, shareAboveHr, weekKey } from '../../engine';

export const RULE_ID = 'intensity_too_high';

/**
 * Sur 12 semaines : ≥ 4 courses > 5 km avec FC, dont ≥ 40 % à plus de 80 % de la FC max.
 * Null sans FC max connue ou estimable, ou sans assez de courses avec FC.
 */
export const intensityTooHigh: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const maxHr = resolveMaxHr(ctx, estimateMaxHr);
    if (!maxHr) return null;
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
      }),
      evidence: [
        {
          label: INTENSITY_LABELS.share(INTENSITY_MIN_RUN_KM, thr),
          value: `${share.above} / ${share.total} (${nf(share.pct)} %)`,
          numeric: share.pct,
        },
        { label: INTENSITY_LABELS.maxHr, value: `${maxHr} bpm`, numeric: maxHr },
        { label: INTENSITY_LABELS.easy, value: `${easyBpm} bpm`, numeric: easyBpm },
      ],
      sessionsUsed: share.total,
      minSessions: INTENSITY_MIN_RUNS,
    });
  },
};
