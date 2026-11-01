import { km, nf, PREP_LABELS, racePrepPastCopy, racePrepUpcomingCopy } from '../copy.fr';
import { buildInsight, pastActivities, round1 } from '../helpers';
import {
  PREP_LONGEST_RUN_RATIO,
  PREP_MIN_SESSIONS,
  PREP_REVIEW_MAX_DAYS,
  PREP_TOO_LATE_DAYS,
  PREP_UPCOMING_MAX_WEEKS,
  PREP_WINDOW_WEEKS,
} from '../thresholds';
import type { InsightContext, InsightRuleDef } from '../types';
import { addDays, daysBetween, racePrep, type RaceCandidate } from '../../engine';

export const RULE_ID = 'race_prep';

function pickRace(ctx: InsightContext): { race: RaceCandidate; upcoming: boolean } | undefined {
  const upcoming = ctx.races
    .filter(
      (r) => r.status === 'upcoming' && r.date > ctx.today && daysBetween(ctx.today, r.date) <= PREP_UPCOMING_MAX_WEEKS * 7,
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (upcoming) return { race: upcoming, upcoming: true };
  const past = ctx.races
    .filter(
      (r) =>
        r.status === 'completed' &&
        r.confidence === 'high' &&
        r.date <= ctx.today &&
        daysBetween(r.date, ctx.today) <= PREP_REVIEW_MAX_DAYS,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return past && { race: past, upcoming: false };
}

/**
 * Course à venir (≤ 12 semaines) ou course passée récente : la plus longue sortie des 8 semaines
 * précédentes (avant la course, ou jusqu'à aujourd'hui pour une course à venir) fait < 60 % de la distance.
 * Null si l'historique ne couvre pas les 8 semaines ou compte moins de 2 courses à pied.
 */
export const racePrepRule: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const picked = pickRace(ctx);
    if (!picked) return null;
    const { race, upcoming } = picked;

    // Course à venir : fenêtre des 8 semaines se terminant aujourd'hui (inclus).
    const windowEnd = upcoming ? { ...race, date: addDays(ctx.today, 1) } : race;
    const prep = racePrep(pastActivities(ctx), windowEnd, PREP_WINDOW_WEEKS);
    const sessions = prep.weeks.reduce((s, w) => s + w.sessions, 0);
    if (!prep.complete || sessions < PREP_MIN_SESSIONS) return null;

    const longestKm = Math.max(...prep.weeks.map((w) => w.longestRunKm));
    const raceKm = race.officialDistanceKm;
    const ratio = longestKm / raceKm;
    if (ratio >= PREP_LONGEST_RUN_RATIO) return null;

    const sharePct = Math.round(ratio * 100);
    const daysToRace = daysBetween(ctx.today, race.date);
    return buildInsight({
      ctx,
      ruleId: RULE_ID,
      periodKey: race.id,
      source: 'coach',
      severity: upcoming ? 'notice' : 'info',
      copy: upcoming
        ? racePrepUpcomingCopy({
            longestKm,
            raceKm,
            sharePct,
            weeks: PREP_WINDOW_WEEKS,
            daysToRace,
            tooLate: daysToRace <= PREP_TOO_LATE_DAYS,
          })
        : racePrepPastCopy({
            longestKm,
            raceKm,
            sharePct,
            weeks: PREP_WINDOW_WEEKS,
            targetKm: round1(raceKm * PREP_LONGEST_RUN_RATIO),
          }),
      evidence: [
        { label: PREP_LABELS.longest(PREP_WINDOW_WEEKS), value: km(longestKm), numeric: longestKm },
        { label: PREP_LABELS.share, value: `${nf(sharePct)} %`, numeric: round1(ratio * 100) },
        { label: PREP_LABELS.total(PREP_WINDOW_WEEKS), value: km(prep.totalKm), numeric: prep.totalKm },
        { label: PREP_LABELS.race, value: km(raceKm), numeric: raceKm },
      ],
      sessionsUsed: sessions,
      minSessions: PREP_MIN_SESSIONS,
    });
  },
};
