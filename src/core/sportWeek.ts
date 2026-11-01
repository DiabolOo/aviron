import { addDaysISO, parseISODate, startOfWeek, toISODate } from '@/src/core/dates';
import type { StravaActivity } from '@/src/core/types';

export type WeekSummary = {
  start: string;
  end: string;
  activities: StravaActivity[];
  count: number;
  km: number;
  durationMin: number;
};

export function weekStartISO(date: Date = new Date()): string {
  return toISODate(startOfWeek(date));
}

export function shiftWeek(startISO: string, weeks: number): string {
  return addDaysISO(startISO, weeks * 7);
}

export function latestActivityDate(activities: StravaActivity[]): string | undefined {
  return activities.reduce<string | undefined>((max, a) => (max === undefined || a.date > max ? a.date : max), undefined);
}

/** Sélecteur unique : la liste et le compteur de la semaine (lundi → dimanche) en dérivent. */
export function selectWeek(activities: StravaActivity[], startISO: string): WeekSummary {
  const start = toISODate(startOfWeek(parseISODate(startISO)));
  const end = addDaysISO(start, 6);
  const inWeek = activities
    .filter((a) => a.date >= start && a.date <= end)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return {
    start,
    end,
    activities: inWeek,
    count: inWeek.length,
    km: inWeek.reduce((sum, a) => sum + (a.distanceKm ?? 0), 0),
    durationMin: inWeek.reduce((sum, a) => sum + a.durationMin, 0),
  };
}

export function groupByMonth(activities: StravaActivity[]): { key: string; label: string; items: StravaActivity[] }[] {
  const sorted = [...activities].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: { key: string; label: string; items: StravaActivity[] }[] = [];
  for (const activity of sorted) {
    const key = activity.date.slice(0, 7);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label = parseISODate(activity.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), items: [] };
      groups.push(group);
    }
    group.items.push(activity);
  }
  return groups;
}
