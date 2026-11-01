import type { Activity } from '../../schemas';
import { hrZones, zoneOf } from './zones';

export interface IntensityOptions {
  types?: Activity['type'][];
  minDistanceKm?: number;
  /** requis pour la répartition par zones */
  maxHr?: number;
}

export interface IntensityReport {
  /** sorties avec FC moyenne connue (les autres ne comptent pas) */
  considered: number;
  /** % de séances dont la FC moyenne tombe dans chaque zone (null si aucune FC) */
  byZone: { zone: number; pct: number | null; count: number }[];
  /** % du temps passé dans chaque zone (durée × FC moyenne comme proxy) */
  byTime: { zone: number; pct: number | null }[];
  avgHr?: number;
}

function eligible(activities: Activity[], opts: IntensityOptions) {
  return activities.filter(
    (a) =>
      a.avgHr !== undefined &&
      (!opts.types || opts.types.includes(a.type)) &&
      a.distanceKm !== undefined &&
      a.distanceKm >= (opts.minDistanceKm ?? 0),
  );
}

export function intensityDistribution(activities: Activity[], opts: IntensityOptions = {}): IntensityReport {
  const list = eligible(activities, opts);
  if (!opts.maxHr) {
    return {
      considered: list.length,
      byZone: [],
      byTime: [],
      avgHr: list.length ? Math.round(list.reduce((s, a) => s + a.avgHr!, 0) / list.length) : undefined,
    };
  }
  const zones = hrZones(opts.maxHr);
  const counts = [0, 0, 0, 0, 0];
  const times = [0, 0, 0, 0, 0];
  for (const a of list) {
    const z = zoneOf(a.avgHr!, zones) - 1;
    counts[z]++;
    times[z] += a.durationMin;
  }
  const totalTime = times.reduce((s, t) => s + t, 0);
  return {
    considered: list.length,
    byZone: counts.map((count, i) => ({
      zone: i + 1,
      count,
      pct: list.length ? Math.round((count / list.length) * 1000) / 10 : null,
    })),
    byTime: times.map((t, i) => ({
      zone: i + 1,
      pct: list.length && totalTime ? Math.round((t / totalTime) * 1000) / 10 : null,
    })),
    avgHr: list.length ? Math.round(list.reduce((s, a) => s + a.avgHr!, 0) / list.length) : undefined,
  };
}

/** Part des sorties dont la FC moyenne dépasse `thresholdBpm` (les sorties sans FC sont exclues). */
export function shareAboveHr(
  activities: Activity[],
  thresholdBpm: number,
  opts: Omit<IntensityOptions, 'maxHr'> = {},
): { above: number; total: number; pct: number } {
  const list = eligible(activities, opts);
  const above = list.filter((a) => a.avgHr! > thresholdBpm).length;
  return { above, total: list.length, pct: list.length ? Math.round((above / list.length) * 1000) / 10 : 0 };
}
