import { km, nf, VOLUME_LABELS, volumeRampCopy } from '../copy.fr';
import { buildInsight, pastRuns, round1 } from '../helpers';
import {
  VOLUME_BASELINE_WEEKS,
  VOLUME_MIN_BASELINE_RUNS,
  VOLUME_MIN_WEEK_KM,
  VOLUME_NEXT_WEEK_FACTOR,
  VOLUME_RAMP_PCT,
  VOLUME_RAMP_WARNING_PCT,
} from '../thresholds';
import type { InsightRuleDef } from '../types';
import { addDays, weekKey } from '../../engine';

export const RULE_ID = 'volume_ramp';

/**
 * Volume course des 7 derniers jours (aujourd'hui inclus) > 130 % de la moyenne hebdomadaire des
 * 4 semaines précédentes, et ≥ 10 km. Null si l'historique ne couvre pas ces 5 semaines,
 * ou si les 4 semaines de référence comptent moins de 4 courses.
 */
export const volumeRamp: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const runs = pastRuns(ctx);
    const weekStart = addDays(ctx.today, -6);
    const baseStart = addDays(weekStart, -VOLUME_BASELINE_WEEKS * 7);
    const first = ctx.activities.map((a) => a.date).sort()[0];
    if (!first || first > baseStart) return null;

    const sumKm = (from: string, to: string) =>
      runs.filter((a) => a.date >= from && a.date <= to).reduce((s, a) => s + (a.distanceKm ?? 0), 0);
    const baseRuns = runs.filter((a) => a.date >= baseStart && a.date < weekStart).length;
    if (baseRuns < VOLUME_MIN_BASELINE_RUNS) return null;

    const weekKm = sumKm(weekStart, ctx.today);
    const baselineKm = sumKm(baseStart, addDays(weekStart, -1)) / VOLUME_BASELINE_WEEKS;
    if (weekKm < VOLUME_MIN_WEEK_KM || baselineKm <= 0) return null;
    const rampPct = round1((weekKm / baselineKm - 1) * 100);
    if (rampPct <= VOLUME_RAMP_PCT) return null;

    const nextWeekKm = Math.round(baselineKm * VOLUME_NEXT_WEEK_FACTOR);
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: weekKey(ctx.today),
      source: 'trend',
      severity: rampPct >= VOLUME_RAMP_WARNING_PCT ? 'warning' : 'notice',
      copy: volumeRampCopy({
        weekKm: round1(weekKm),
        baselineKm: round1(baselineKm),
        rampPct: Math.round(rampPct),
        nextWeekKm,
        weeks: VOLUME_BASELINE_WEEKS,
      }),
      evidence: [
        { label: VOLUME_LABELS.week, value: km(weekKm), numeric: round1(weekKm) },
        { label: VOLUME_LABELS.baseline(VOLUME_BASELINE_WEEKS), value: km(baselineKm), numeric: round1(baselineKm) },
        { label: VOLUME_LABELS.ramp, value: `+${nf(rampPct)} %`, numeric: round1(rampPct) },
      ],
      sessionsUsed: runs.filter((a) => a.date >= baseStart).length,
      minSessions: VOLUME_MIN_BASELINE_RUNS,
    });
  },
};
