import { fullSegments } from './training/highlights/highlightOf';

export interface CurvePoint {
  x: number;
  y: number;
  km: number;
  paceSec: number;
  /** plus rapide que l'allure moyenne */
  faster: boolean;
  avgHr?: number;
}

export interface PaceCurveModel {
  points: CurvePoint[];
  avgPaceSec: number;
  avgY: number;
  /** bornes de l'axe (s/km) : fastest en haut, slowest en bas */
  fastestSec: number;
  slowestSec: number;
  /** longueur approximative du tracé, pour l'animation de dessin */
  length: number;
}

export const MIN_CURVE_SPLITS = 3;

/**
 * Modèle de la courbe d'allure : axe inversé (plus haut = plus rapide), arrêts exclus.
 * Null sous 3 splits complets : rien d'approximatif à dessiner.
 */
export function paceCurveModel(
  splits: { km: number; paceSec: number; avgHr?: number }[] | undefined,
  width: number,
  height: number,
  pad: { left: number; right: number; top: number; bottom: number },
): PaceCurveModel | null {
  const segs = fullSegments(splits);
  if (segs.length < MIN_CURVE_SPLITS || width <= 0 || height <= 0) return null;
  const hrByKm = new Map((splits ?? []).map((s) => [s.km, s.avgHr]));
  const paces = segs.map((s) => s.paceSec);
  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  const avg = paces.reduce((s, p) => s + p, 0) / paces.length;
  const margin = Math.max(5, (slowest - fastest) * 0.15);
  const top = fastest - margin;
  const bottom = slowest + margin;
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const yOf = (p: number) => pad.top + ((p - top) / (bottom - top)) * innerH;

  const points: CurvePoint[] = segs.map((s, i) => ({
    x: pad.left + (i / (segs.length - 1)) * innerW,
    y: yOf(s.paceSec),
    km: s.km,
    paceSec: s.paceSec,
    faster: s.paceSec < avg,
    avgHr: hrByKm.get(s.km),
  }));
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);

  return { points, avgPaceSec: avg, avgY: yOf(avg), fastestSec: top, slowestSec: bottom, length: Math.ceil(length * 1.15) };
}
