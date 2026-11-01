import type { Activity } from '../../schemas';
import { daysBetween, weekKey } from './periods';

export interface TrainingGap {
  /** dernier jour actif avant la coupure */
  from: string;
  /** premier jour actif après la coupure */
  to: string;
  /** jours consécutifs sans séance */
  days: number;
}

export interface RegularityReport {
  /** semaines calendaires entre la 1re et la dernière séance */
  totalWeeks: number;
  /** semaines avec ≥ 1 séance */
  activeWeeks: number;
  sessionsPerWeek: number;
  longestGapDays: number;
  /** coupures ≥ `gapDays` (défaut 7) */
  gaps: TrainingGap[];
}

export function regularity(
  activities: Activity[],
  opts: { gapDays?: number } = {},
): RegularityReport {
  const threshold = opts.gapDays ?? 7;
  const dates = [...new Set(activities.map((a) => a.date))].sort();
  if (dates.length < 2) {
    return { totalWeeks: 1, activeWeeks: 1, sessionsPerWeek: activities.length, longestGapDays: 0, gaps: [] };
  }

  const span = daysBetween(dates[0], dates[dates.length - 1]);
  const totalWeeks = Math.max(1, Math.ceil((span + 1) / 7));
  const activeWeeks = new Set(dates.map(weekKey)).size;

  const gaps: TrainingGap[] = [];
  let longest = 0;
  for (let i = 1; i < dates.length; i++) {
    const days = daysBetween(dates[i - 1], dates[i]) - 1; // jours sans séance entre deux jours actifs
    if (days > longest) longest = days;
    if (days >= threshold) gaps.push({ from: dates[i - 1], to: dates[i], days });
  }

  return {
    totalWeeks,
    activeWeeks,
    sessionsPerWeek: Math.round((activities.length / totalWeeks) * 100) / 100,
    longestGapDays: longest,
    gaps,
  };
}
