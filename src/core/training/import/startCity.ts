import type { FitData } from './fit';
import type { GpxTrackPoint } from './gpx';
import { CITIES_FR, type CityRow } from './cities-fr';

// Ville de départ d'une course : premier point GPS de la trace → commune la plus
// proche dans CITIES_FR (GeoNames cities1000, France). Les coordonnées ne sont
// jamais stockées : seul le nom de la ville est écrit sur l'activité (ADR-004,
// amendement 2026-11-01 — courses uniquement, jamais vers le coach IA).

export interface LatLon {
  lat: number;
  lon: number;
}

const SEMICIRCLE_DEG = 180 / 2 ** 31;

/** Degrés, que la valeur soit déjà en degrés ou en semicircles FIT bruts. */
function toDegrees(v: number): number {
  return Math.abs(v) > 180 ? v * SEMICIRCLE_DEG : v;
}

/** Premier record FIT géolocalisé (position_lat/long, semicircles → degrés par le parseur). */
export function firstFitPoint(fit: FitData): LatLon | undefined {
  for (const r of fit.records ?? []) {
    if (r.position_lat === undefined || r.position_long === undefined) continue;
    const lat = toDegrees(r.position_lat);
    const lon = toDegrees(r.position_long);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon };
  }
  return undefined;
}

/** Premier point de la trace GPX. */
export function firstGpxPoint(points: GpxTrackPoint[]): LatLon | undefined {
  const p = points[0];
  return p && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180 ? { lat: p.lat, lon: p.lon } : undefined;
}

function haversineM(a: LatLon, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nom de la ville la plus proche du point (liste France métro + DOM ; rien si liste vide). */
export function nearestCityName(p: LatLon, cities: readonly CityRow[] = CITIES_FR): string | undefined {
  let best: string | undefined;
  let bestM = Infinity;
  for (const [name, lat, lon] of cities) {
    const d = haversineM(p, { lat, lon });
    if (d < bestM) {
      bestM = d;
      best = name;
    }
  }
  return best;
}
