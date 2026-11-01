import type { Split } from '../types';

// Point de trace ramené à une distance cumulée (m), un temps (s depuis le départ),
// une FC et une altitude — forme neutre produite par les parseurs FIT et GPX.

export interface TrackPoint {
  distM: number;
  timeS?: number;
  hr?: number;
  eleM?: number;
}

export function formatPace(paceSec: number): string {
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Découpe une trace en splits d'1 km (le dernier peut être partiel). */
export function splitsFromPoints(points: TrackPoint[]): Split[] | undefined {
  const sorted = [...points].sort((a, b) => a.distM - b.distM);
  const timed = sorted.filter((p) => p.timeS !== undefined);
  if (sorted.length < 2 || timed.length < 2) return undefined;

  const total = sorted[sorted.length - 1].distM;
  if (total < 100) return undefined;

  // Temps interpolé à une distance donnée, à partir des points horodatés.
  const timeAt = (d: number): number => {
    if (d <= timed[0].distM) return timed[0].timeS!;
    for (let i = 1; i < timed.length; i++) {
      if (timed[i].distM >= d) {
        const a = timed[i - 1];
        const b = timed[i];
        const f = (d - a.distM) / (b.distM - a.distM);
        return a.timeS! + f * (b.timeS! - a.timeS!);
      }
    }
    return timed[timed.length - 1].timeS!;
  };

  const bounds: { startM: number; endM: number }[] = [];
  const full = Math.floor(total / 1000);
  for (let k = 0; k < full; k++) bounds.push({ startM: k * 1000, endM: (k + 1) * 1000 });
  if (total - full * 1000 >= 20) bounds.push({ startM: full * 1000, endM: total });

  const splits: Split[] = [];
  for (const { startM, endM } of bounds) {
    const distKm = (endM - startM) / 1000;
    const durS = timeAt(endM) - timeAt(startM);
    const paceSec = durS > 0 ? Math.round(durS / distKm) : 0;

    const inside = sorted.filter((p) => p.distM >= startM && p.distM <= endM);
    const hrs = inside.map((p) => p.hr).filter((h): h is number => h !== undefined);
    let gain = 0;
    for (let i = 1; i < inside.length; i++) {
      const a = inside[i - 1].eleM;
      const b = inside[i].eleM;
      if (a !== undefined && b !== undefined && b > a) gain += b - a;
    }

    splits.push({
      km: Math.round((endM / 1000) * 100) / 100,
      pace: paceSec > 0 ? formatPace(paceSec) : '',
      paceSec,
      elevationGain: Math.round(gain),
      avgHr: hrs.length ? Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length) : undefined,
    });
  }

  return splits.length ? splits : undefined;
}
