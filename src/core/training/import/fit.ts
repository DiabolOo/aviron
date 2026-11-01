import type { Activity } from '../../schemas';
import type { Split } from '../types';
import { formatPace, splitsFromPoints, type TrackPoint } from './splits';

// Données normalisées issues d'un fichier FIT (n'importe quel parseur FIT
// peut produire cette forme ; fit-file-parser en mode 'list' s'y rapproche).
// Distances en mètres, durées en secondes.

export interface FitSession {
  sport?: string;
  start_time?: Date | string;
  total_distance?: number; // m
  total_elapsed_time?: number; // s
  total_moving_time?: number; // s
  avg_heart_rate?: number;
  max_heart_rate?: number;
  total_ascent?: number; // m
  total_calories?: number;
}

export interface FitLap {
  start_time?: Date | string;
  total_distance?: number; // m
  total_timer_time?: number; // s
  total_elapsed_time?: number; // s
  avg_heart_rate?: number;
  total_ascent?: number; // m
}

export interface FitRecord {
  timestamp?: Date | string;
  distance?: number; // m
  heart_rate?: number;
  altitude?: number; // m
}

export interface FitData {
  sessions?: FitSession[];
  laps?: FitLap[];
  records?: FitRecord[];
}

function toIsoOffset(t: Date | string | undefined): string | undefined {
  if (!t) return undefined;
  const d = t instanceof Date ? t : new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

/** Splits d'1 km calculés sur les records (distance + timestamp + heart_rate). */
function recordsToSplits(records: FitRecord[]): Split[] | undefined {
  const pts: TrackPoint[] = [];
  let t0: number | undefined;
  let prevDist = -1;
  for (const r of records) {
    const dist = r.distance;
    if (dist === undefined || dist < prevDist) continue;
    prevDist = dist;
    const t = r.timestamp ? new Date(r.timestamp).getTime() : NaN;
    if (Number.isFinite(t)) {
      if (t0 === undefined) t0 = t;
      pts.push({ distM: dist, timeS: (t - t0) / 1000, hr: r.heart_rate, eleM: r.altitude });
    } else {
      pts.push({ distM: dist, hr: r.heart_rate, eleM: r.altitude });
    }
  }
  return splitsFromPoints(pts);
}

function lapsToSplits(laps: FitLap[]): Split[] | undefined {
  const splits: Split[] = [];
  let cumKm = 0;
  for (const lap of laps) {
    const dist = lap.total_distance;
    const dur = lap.total_timer_time ?? lap.total_elapsed_time;
    if (!dist || !dur || dist <= 0) continue;
    cumKm += dist / 1000;
    const paceSec = dur / (dist / 1000);
    splits.push({
      km: Math.round(cumKm * 100) / 100,
      pace: formatPace(paceSec),
      paceSec: Math.round(paceSec),
      elevationGain: lap.total_ascent ?? 0,
      avgHr: lap.avg_heart_rate,
    });
  }
  return splits.length ? splits : undefined;
}

/** Complète une Activity issue du CSV avec la session et les records du FIT correspondant. */
export function mergeFitData(activity: Activity, fit: FitData): Activity {
  const session = fit.sessions?.[0];
  const startedAt = toIsoOffset(
    session?.start_time ?? fit.records?.[0]?.timestamp ?? fit.laps?.[0]?.start_time,
  );
  // Les records (trace réelle) priment ; les laps ne servent qu'en dernier recours.
  const splits = recordsToSplits(fit.records ?? []) ?? lapsToSplits(fit.laps ?? []);

  return {
    ...activity,
    startedAt: activity.startedAt ?? startedAt,
    distanceKm: activity.distanceKm ?? (session?.total_distance ? session.total_distance / 1000 : undefined),
    elevationM: activity.elevationM ?? session?.total_ascent,
    calories: activity.calories ?? session?.total_calories,
    avgHr: activity.avgHr ?? session?.avg_heart_rate,
    maxHr: activity.maxHr ?? session?.max_heart_rate,
    splits: activity.splits ?? splits,
  };
}
