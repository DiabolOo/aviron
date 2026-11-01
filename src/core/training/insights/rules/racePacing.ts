import { cautiousStartCopy, fastStartCopy, nf, PACING_LABELS, paceFr } from '../copy.fr';
import { buildInsight, round1 } from '../helpers';
import { PACING_GAP_PCT, PACING_MAX_AGE_DAYS, PACING_MIN_COVERAGE, PACING_MIN_SPLITS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { daysBetween, raceDebrief } from '../../engine';

export const RULE_ID = 'race_pacing';

/**
 * Dernière course confirmée (confiance 'high') des 28 derniers jours, avec temps de passage :
 * - 2e moitié plus lente de > 5 % que la 1re → départ trop rapide ;
 * - sinon 1er quart plus lent de > 5 % que la moyenne (moyenne des deux moitiés) → départ trop prudent.
 * Allures recalées sur la distance officielle ; les écarts sont des rapports, donc identiques à la mesure brute.
 */
export const racePacing: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const races = ctx.races
      .filter(
        (r) =>
          r.status === 'completed' &&
          r.confidence === 'high' &&
          r.date <= ctx.today &&
          daysBetween(r.date, ctx.today) <= PACING_MAX_AGE_DAYS,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const race of races) {
      const activity = ctx.activities.find((a) => a.id === race.activityId);
      const splits = activity?.splits;
      if (!activity || !splits || splits.length < PACING_MIN_SPLITS) continue;
      const distanceKm = race.measuredDistanceKm ?? activity.distanceKm ?? race.officialDistanceKm;
      if (splits[splits.length - 1].km < PACING_MIN_COVERAGE * distanceKm) continue;

      const { halves, bands } = raceDebrief(race, activity);
      const q1 = bands[0].officialPaceSec;
      if (!halves || q1 === undefined) continue;

      const first = halves.first.officialPaceSec;
      const second = halves.second.officialPaceSec;
      const evenPace = Math.round((first + second) / 2);
      const common = { ctx, ruleId: RULE_ID, periodKey: race.id, source: 'coach' as const, sessionsUsed: 1, minSessions: 1 };

      const slowdown = round1((second / first - 1) * 100);
      if (slowdown > PACING_GAP_PCT) {
        return buildInsight({
          ...common,
          severity: 'notice',
          copy: fastStartCopy({ gapPct: slowdown, firstPaceSec: first, secondPaceSec: second, evenPaceSec: evenPace }),
          evidence: [
            { label: PACING_LABELS.firstHalf, value: paceFr(first), numeric: first },
            { label: PACING_LABELS.secondHalf, value: paceFr(second), numeric: second },
            { label: PACING_LABELS.gapHalves, value: `+${nf(slowdown, 1)} %`, numeric: slowdown },
          ],
        });
      }

      const cautious = round1((q1 / evenPace - 1) * 100);
      if (cautious > PACING_GAP_PCT) {
        return buildInsight({
          ...common,
          severity: 'info',
          copy: cautiousStartCopy({ gapPct: cautious, firstQuarterPaceSec: q1, averagePaceSec: evenPace }),
          evidence: [
            { label: PACING_LABELS.firstQuarter, value: paceFr(q1), numeric: q1 },
            { label: PACING_LABELS.average, value: paceFr(evenPace), numeric: evenPace },
            { label: PACING_LABELS.gapQuarter, value: `+${nf(cautious, 1)} %`, numeric: cautious },
          ],
        });
      }
      return null;
    }
    return null;
  },
};
