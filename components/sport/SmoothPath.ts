import type { RoutePoint } from '@/lib/types';

export function smoothPath(points: RoutePoint[], closed = false): string {
  if (points.length < 2) return '';
  const p = (i: number): RoutePoint =>
    closed ? points[(i + points.length) % points.length] : points[Math.min(points.length - 1, Math.max(0, i))];
  const segments = closed ? points.length : points.length - 1;
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < segments; i += 1) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
