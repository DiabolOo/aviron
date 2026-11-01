import type { Activity } from '../../schemas';

// Regroupement par semaine ISO, mois et trimestre. Les dates des activités sont
// déjà en heure de Paris (YYYY-MM-DD) — le découpage calendaire se fait dessus.

export function weekKey(date: string): string {
  const d = new Date(`${date}T12:00:00Z`); // midi UTC : pas de bascule de jour
  const day = d.getUTCDay() || 7;
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() - day + 4);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.floor((thursday.getTime() - yearStart.getTime()) / 604800000) + 1;
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function quarterKey(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export interface PeriodVolume {
  key: string;
  sessions: number;
  distanceKm: number;
  durationMin: number;
  elevationM: number;
  /** nombre de séances par type */
  byType: Partial<Record<Activity['type'], number>>;
}

export interface VolumeOptions {
  types?: Activity['type'][];
  from?: string; // YYYY-MM-DD inclus
  to?: string; // YYYY-MM-DD inclus
}

function groupVolume(activities: Activity[], keyOf: (date: string) => string, opts: VolumeOptions): PeriodVolume[] {
  const buckets = new Map<string, PeriodVolume>();
  for (const a of activities) {
    if (opts.types && !opts.types.includes(a.type)) continue;
    if (opts.from && a.date < opts.from) continue;
    if (opts.to && a.date > opts.to) continue;
    const key = keyOf(a.date);
    let b = buckets.get(key);
    if (!b) {
      b = { key, sessions: 0, distanceKm: 0, durationMin: 0, elevationM: 0, byType: {} };
      buckets.set(key, b);
    }
    b.sessions++;
    b.distanceKm += a.distanceKm ?? 0;
    b.durationMin += a.durationMin;
    b.elevationM += a.elevationM ?? 0;
    b.byType[a.type] = (b.byType[a.type] ?? 0) + 1;
  }
  for (const b of buckets.values()) {
    b.distanceKm = Math.round(b.distanceKm * 100) / 100;
    b.durationMin = Math.round(b.durationMin * 10) / 10;
  }
  return [...buckets.values()].sort((x, y) => x.key.localeCompare(y.key));
}

export function weeklyVolume(activities: Activity[], opts: VolumeOptions = {}): PeriodVolume[] {
  return groupVolume(activities, weekKey, opts);
}

export function monthlyVolume(activities: Activity[], opts: VolumeOptions = {}): PeriodVolume[] {
  return groupVolume(activities, monthKey, opts);
}
