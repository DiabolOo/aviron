import { CONFIRM_LABELS, confirmRaceCopy } from '../copy.fr';
import { buildInsight, isConfirmedRace, round1 } from '../helpers';
import { CONFIRM_RACE_MAX_AGE_DAYS } from '../thresholds';
import type { InsightRuleDef } from '../types';
import { daysBetween } from '../../engine';

export const RULE_ID = 'confirm_race';

/**
 * Candidate de course (confiance 'high') des 28 derniers jours, ni confirmée ni déclarée :
 * demande « C'était une course ? » sans aucun chiffre de débrief. Les candidates écartées par
 * l'utilisateur ne sont pas dans `ctx.races` (detectRaces les exclut via rejectedIds).
 */
export const confirmRace: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const race = ctx.races
      .filter(
        (r) =>
          r.status === 'completed' &&
          r.confidence === 'high' &&
          r.date <= ctx.today &&
          daysBetween(r.date, ctx.today) <= CONFIRM_RACE_MAX_AGE_DAYS &&
          !isConfirmedRace(ctx, r),
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!race) return null;

    const distanceKm = round1(race.measuredDistanceKm ?? race.officialDistanceKm);
    const daysAgo = daysBetween(race.date, ctx.today);
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: race.id,
      source: 'trend',
      severity: 'info',
      copy: confirmRaceCopy({ distanceKm, date: race.date }),
      evidence: [
        { label: CONFIRM_LABELS.distance, value: `${distanceKm} km`.replace('.', ','), numeric: distanceKm },
        { label: CONFIRM_LABELS.daysAgo, value: `${daysAgo} j`, numeric: daysAgo },
      ],
      sessionsUsed: 1,
      minSessions: 1,
    });
  },
};
