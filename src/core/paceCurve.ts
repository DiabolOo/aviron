import { formatKmNumber, formatSecAsClock } from './sportFormat';
import { curveSegments } from './training/highlights/highlightOf';

export interface CurvePoint {
  x: number;
  y: number;
  km: number;
  paceSec: number;
  /** plus rapide que l'allure moyenne */
  faster: boolean;
  avgHr?: number;
}

export interface CurveTick {
  paceSec: number;
  y: number;
}

export interface PaceCurveModel {
  points: CurvePoint[];
  avgPaceSec: number;
  avgY: number;
  /** bornes de l'axe (s/km) : fastest en haut, slowest en bas */
  fastestSec: number;
  slowestSec: number;
  /** 2 ou 3 graduations à des valeurs rondes (1 seule si l'étendue est minuscule) */
  ticks: CurveTick[];
  /** ordonnée de la ligne de base (bas du graphique), pour les barres */
  baseY: number;
  /** moins de 5 points : des barres, jamais de courbe */
  mode: 'curve' | 'bars';
  /** longueur approximative du tracé, pour l'animation de dessin */
  length: number;
}

export const MIN_CURVE_SPLITS = 3;
/** En dessous de 5 points, une courbe ne dit rien : barres. */
export const MIN_CURVE_POINTS = 5;

const TICK_STEPS = [5, 10, 15, 20, 30, 60, 120];

/** 2 ou 3 graduations multiples d'un pas rond (5, 10, 15, 20, 30, 60, 120 s) dans [top, bottom]. */
export function roundTicks(top: number, bottom: number): number[] {
  let fallback: number[] = [];
  for (const step of TICK_STEPS) {
    const ticks: number[] = [];
    for (let v = Math.ceil(top / step) * step; v <= bottom; v += step) ticks.push(v);
    if (ticks.length >= 2 && ticks.length <= 3) return ticks;
    if (ticks.length > 0 && ticks.length < 2 && fallback.length === 0) fallback = ticks;
  }
  return fallback;
}

/**
 * Modèle de la courbe d'allure : axe inversé (plus haut = plus rapide), arrêts exclus.
 * Null sous 3 splits : rien d'approximatif à dessiner. Les derniers splits partiels sont inclus.
 */
export function paceCurveModel(
  splits: { km: number; paceSec: number; avgHr?: number }[] | undefined,
  width: number,
  height: number,
  pad: { left: number; right: number; top: number; bottom: number },
  /** allure moyenne affichée (temps de déplacement / distance, comme le chiffre clé) ; défaut : moyenne des splits */
  avgPaceSec?: number,
): PaceCurveModel | null {
  const segs = curveSegments(splits);
  if (segs.length < MIN_CURVE_SPLITS || width <= 0 || height <= 0) return null;
  const hrByKm = new Map((splits ?? []).map((s) => [s.km, s.avgHr]));
  const paces = segs.map((s) => s.paceSec);
  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  const mean = paces.reduce((s, p) => s + p, 0) / paces.length;
  const avg = avgPaceSec !== undefined && avgPaceSec > 0 ? avgPaceSec : mean;
  const lo = Math.min(fastest, avg);
  const hi = Math.max(slowest, avg);
  const margin = Math.max(5, (hi - lo) * 0.15);
  const top = lo - margin;
  const bottom = hi + margin;
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

  return {
    points,
    avgPaceSec: avg,
    avgY: yOf(avg),
    fastestSec: top,
    slowestSec: bottom,
    ticks: roundTicks(top, bottom).map((paceSec) => ({ paceSec, y: yOf(paceSec) })),
    baseY: pad.top + innerH,
    mode: points.length >= MIN_CURVE_POINTS ? 'curve' : 'bars',
    length: Math.ceil(length * 1.15),
  };
}

/**
 * Tracé en interpolation monotone (Fritsch-Carlson) : la courbe ne dépasse jamais les points réels
 * (pas de bosse entre deux points, ni d'allure plus rapide que la meilleure mesurée).
 */
export function monotonePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 2) return '';
  const f = (v: number) => v.toFixed(1);
  const dx = points.slice(1).map((p, i) => p.x - points[i].x);
  const slope = points.slice(1).map((p, i) => (dx[i] === 0 ? 0 : (p.y - points[i].y) / dx[i]));
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  m.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      m[i] = (3 * a * slope[i]) / h;
      m[i + 1] = (3 * b * slope[i]) / h;
    }
  }
  let d = `M${f(points[0].x)},${f(points[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p = points[i];
    const q = points[i + 1];
    d += ` C${f(p.x + dx[i] / 3)},${f(p.y + (m[i] * dx[i]) / 3)} ${f(q.x - dx[i] / 3)},${f(q.y - (m[i + 1] * dx[i]) / 3)} ${f(q.x)},${f(q.y)}`;
  }
  return d;
}

/** Index du point le plus proche de l'abscisse `x`. */
export function nearestPointIndex(points: { x: number }[], x: number): number {
  let best = 0;
  for (let i = 1; i < points.length; i++) if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i;
  return best;
}

/** « 21,9 » ou « 14 » : virgule française, sans « ,0 » pour un km entier. */
export const kmValueFr = (km: number): string => (Number.isInteger(km) ? `${km}` : formatKmNumber(km));

/** Libellé d'axe : « km 21,9 », ou « arrivée » pour le dernier point d'une course. */
export const axisKmLabel = (km: number, finish = false): string => (finish ? 'arrivée' : `km ${kmValueFr(km)}`);

/** Info-bulle : « Km 14 · 5:12 /km » (+ « · 152 bpm » si la FC existe). */
export function tooltipLabel(p: { km: number; paceSec: number; avgHr?: number }): string {
  const base = `Km ${kmValueFr(p.km)} · ${formatSecAsClock(p.paceSec)} /km`;
  return p.avgHr !== undefined ? `${base} · ${p.avgHr} bpm` : base;
}
