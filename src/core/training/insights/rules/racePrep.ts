import {
  km,
  nf,
  paceFr,
  PREP_LABELS,
  racePrepFinalCopy,
  racePrepPastCopy,
  racePrepReachableCopy,
  racePrepShortCopy,
} from '../copy.fr';
import { buildInsight, isConfirmedRace, pastActivities, round1, targetPaceSec } from '../helpers';
import {
  PREP_LONGEST_RUN_RATIO,
  PREP_MIN_SESSIONS,
  PREP_REVIEW_MAX_DAYS,
  PREP_TOO_LATE_DAYS,
  PREP_UPCOMING_MAX_WEEKS,
  PREP_WEEKLY_GROWTH,
  PREP_WINDOW_WEEKS,
} from '../thresholds';
import type { BuildInsightInput, InsightContext, InsightEvidence, InsightRuleDef } from '../types';
import { addDays, daysBetween, racePrep, type RaceCandidate } from '../../engine';

export const RULE_ID = 'race_prep';

/** Course à venir ou passée la plus pertinente — toujours déclarée (goalId) ou confirmée (confirmedIds). */
function pickRace(ctx: InsightContext): { race: RaceCandidate; upcoming: boolean } | undefined {
  const upcoming = ctx.races
    .filter(
      (r) =>
        r.status === 'upcoming' &&
        isConfirmedRace(ctx, r) &&
        r.date > ctx.today &&
        daysBetween(ctx.today, r.date) <= PREP_UPCOMING_MAX_WEEKS * 7,
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (upcoming) return { race: upcoming, upcoming: true };
  const past = ctx.races
    .filter(
      (r) =>
        r.status === 'completed' &&
        isConfirmedRace(ctx, r) &&
        r.date <= ctx.today &&
        daysBetween(r.date, ctx.today) <= PREP_REVIEW_MAX_DAYS,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return past && { race: past, upcoming: false };
}

/** Sortie longue après `weeks` semaines à +10 % par semaine. */
const projectedLongestKm = (longestKm: number, weeks: number): number => longestKm * (1 + PREP_WEEKLY_GROWTH) ** weeks;

/**
 * Course déclarée ou confirmée, à venir (≤ 12 semaines) ou passée récente : la plus longue sortie des 8 semaines
 * précédentes (avant la course, ou jusqu'à aujourd'hui pour une course à venir) fait < 60 % de la distance.
 * - à venir, > 10 jours : si +10 % par semaine suffit d'ici la course → conseil de progression ;
 *   sinon → « préparation courte : allure régulière, finis en confiance » ;
 * - à venir, ≤ 10 jours : carte « dernière ligne droite » (allure, affûtage,
 *   allure visée si targetTime est exploitable), sans critique et sans condition sur la préparation ;
 * - passée : bilan, uniquement si la course est confirmée ou déclarée.
 * Null si l'historique ne couvre pas les 8 semaines ou compte moins de 2 courses à pied.
 */
export const racePrepRule: InsightRuleDef = {
  ruleId: RULE_ID,
  evaluate(ctx) {
    const picked = pickRace(ctx);
    if (!picked) return null;
    const { race, upcoming } = picked;

    // Dernière ligne droite : quelle que soit la préparation (aucune donnée d'historique requise).
    if (upcoming && daysBetween(ctx.today, race.date) <= PREP_TOO_LATE_DAYS) {
      const daysToRace = daysBetween(ctx.today, race.date);
      const paceSec = targetPaceSec(race.targetTime, race.officialDistanceKm);
      return buildInsight({
        ctx,
        ruleId: RULE_ID,
        periodKey: race.id,
        source: 'trend',
        severity: 'info',
        copy: racePrepFinalCopy({ daysToRace, targetPaceSec: paceSec }),
        evidence: [
          { label: PREP_LABELS.daysLeft, value: `${daysToRace} j`, numeric: daysToRace },
          { label: PREP_LABELS.race, value: km(race.officialDistanceKm), numeric: race.officialDistanceKm },
          ...(paceSec === undefined ? [] : [{ label: PREP_LABELS.targetPace, value: paceFr(paceSec), numeric: paceSec }]),
        ],
        sessionsUsed: 1,
        minSessions: 1,
      });
    }

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
    const numbers = { longestKm, raceKm, sharePct, weeks: PREP_WINDOW_WEEKS };
    const common = {
      ctx,
      ruleId: RULE_ID,
      periodKey: race.id,
      source: 'trend',
      sessionsUsed: sessions,
      minSessions: PREP_MIN_SESSIONS,
    } satisfies Partial<BuildInsightInput>;
    const stats: InsightEvidence[] = [
      { label: PREP_LABELS.longest(PREP_WINDOW_WEEKS), value: km(longestKm), numeric: longestKm },
      { label: PREP_LABELS.share, value: `${nf(sharePct)} %`, numeric: round1(ratio * 100) },
      { label: PREP_LABELS.total(PREP_WINDOW_WEEKS), value: km(prep.totalKm), numeric: prep.totalKm },
      { label: PREP_LABELS.race, value: km(raceKm), numeric: raceKm },
    ];

    if (!upcoming) {
      return buildInsight({
        ...common,
        severity: 'info',
        copy: racePrepPastCopy({ ...numbers, targetKm: round1(raceKm * PREP_LONGEST_RUN_RATIO) }),
        evidence: stats,
      });
    }

    const weeksLeft = Math.floor(daysToRace / 7);
    const reachable = longestKm > 0 && projectedLongestKm(longestKm, weeksLeft) >= raceKm * PREP_LONGEST_RUN_RATIO;
    return buildInsight({
      ...common,
      severity: 'notice',
      copy: reachable
        ? racePrepReachableCopy({ ...numbers, weeksLeft, nextKm: round1(projectedLongestKm(longestKm, 1)) })
        : racePrepShortCopy({ ...numbers, weeksLeft }),
      evidence: [...stats, { label: PREP_LABELS.weeksLeft, value: `${weeksLeft}`, numeric: weeksLeft }],
    });
  },
};
