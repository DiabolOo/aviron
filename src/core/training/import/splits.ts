import type { Split } from '../types';

// Point de trace ramené à une distance cumulée (m), un temps (s depuis le départ),
// une FC et une altitude — forme neutre produite par les parseurs FIT et GPX.

export interface TrackPoint {
  distM: number;
  timeS?: number;
  hr?: number;
  eleM?: number;
}

/** En dessous (m/s), un segment est un arrêt : exclu du temps des splits. */
export const MIN_MOVING_SPEED_MS = 1;
/** Durée minimale (s) d'une série de segments lents pour compter comme un arrêt. */
export const MIN_STOP_S = 30;

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

  // Temps de déplacement cumulé à chaque point horodaté. Un arrêt = série de segments consécutifs
  // lents (< MIN_MOVING_SPEED_MS : feu, pause, café, trou de signal) durant au moins MIN_STOP_S ;
  // en dessous, c'est du bruit GPS en pleine foulée (0,9 m en 1 s) et le temps reste compté.
  // Pendant un arrêt, seul compte le temps de parcourir la distance réellement avancée à l'allure de course.
  const segDt = (i: number) => timed[i].timeS! - timed[i - 1].timeS!;
  const segDd = (i: number) => timed[i].distM - timed[i - 1].distM;
  const stopped: boolean[] = new Array(timed.length).fill(false);
  let runStart = -1;
  let runTime = 0;
  const closeRun = (end: number) => {
    if (runStart >= 0 && runTime >= MIN_STOP_S) for (let k = runStart; k <= end; k++) stopped[k] = true;
    runStart = -1;
    runTime = 0;
  };
  for (let i = 1; i < timed.length; i++) {
    if (segDt(i) > 0 && segDd(i) / segDt(i) < MIN_MOVING_SPEED_MS) {
      if (runStart < 0) runStart = i;
      runTime += segDt(i);
    } else closeRun(i - 1);
  }
  closeRun(timed.length - 1);

  const speeds: number[] = [];
  for (let i = 1; i < timed.length; i++) if (!stopped[i] && segDt(i) > 0 && segDt(i) <= 5) speeds.push(segDd(i) / segDt(i));
  speeds.sort((a, b) => a - b);
  const runSpeed = speeds.length ? speeds[Math.floor(speeds.length / 2)] : 0;

  const moving: number[] = [0];
  for (let i = 1; i < timed.length; i++) {
    const dt = segDt(i);
    const kept = dt <= 0 ? 0 : stopped[i] ? (runSpeed > 0 ? Math.min(dt, segDd(i) / runSpeed) : 0) : dt;
    moving.push(moving[i - 1] + kept);
  }

  // Temps de déplacement interpolé à une distance donnée.
  const timeAt = (d: number): number => {
    if (d <= timed[0].distM) return 0;
    for (let i = 1; i < timed.length; i++) {
      if (timed[i].distM >= d) {
        const a = timed[i - 1];
        const b = timed[i];
        const f = (d - a.distM) / (b.distM - a.distM);
        return moving[i - 1] + f * (moving[i] - moving[i - 1]);
      }
    }
    return moving[moving.length - 1];
  };

  // Temps écoulé interpolé (arrêts compris) : pour les débriefs de course, qui suivent le chrono.
  const elapsedAt = (d: number): number => {
    if (d <= timed[0].distM) return timed[0].timeS!;
    for (let i = 1; i < timed.length; i++) {
      if (timed[i].distM >= d) {
        const a = timed[i - 1];
        const b = timed[i];
        return a.timeS! + ((d - a.distM) / (b.distM - a.distM)) * (b.timeS! - a.timeS!);
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
    const elapsedS = elapsedAt(endM) - elapsedAt(startM);
    const elapsedPaceSec = elapsedS > 0 ? Math.round(elapsedS / distKm) : undefined;

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
      elapsedPaceSec,
      elevationGain: Math.round(gain),
      avgHr: hrs.length ? Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length) : undefined,
    });
  }

  return splits.length ? splits : undefined;
}
