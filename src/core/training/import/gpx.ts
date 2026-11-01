import type { Activity } from '../../schemas';
import type { Split } from '../types';
import { splitsFromPoints, type TrackPoint } from './splits';

// Trace GPX ramenée à des points lat/lon (+ altitude et heure optionnelles) :
// forme neutre, indépendante du parseur (gpxparser en produit via tracks[].points).

export interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date | string;
  hr?: number;
}

export interface GpxData {
  startedAt?: string;
  /** distance haversine brute de la trace */
  rawDistanceM: number;
  /** distance normalisée sur la distance CSV quand elle est connue */
  distanceM: number;
  elevationGainM: number;
  splits?: Split[];
}

function haversineM(a: GpxTrackPoint, b: GpxTrackPoint): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toIsoOffset(t: Date | string | undefined): string | undefined {
  if (!t) return undefined;
  const d = t instanceof Date ? t : new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

/**
 * Cumule la distance par haversine puis la normalise pour que le total
 * égale `targetDistanceM` (distance « mètres » du CSV) quand elle est connue.
 */
export function gpxToData(points: GpxTrackPoint[], targetDistanceM?: number): GpxData | undefined {
  if (points.length < 2) return undefined;

  const cumM: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumM.push(cumM[i - 1] + haversineM(points[i - 1], points[i]));
  }
  const rawTotal = cumM[cumM.length - 1];
  const scale = targetDistanceM && targetDistanceM > 0 && rawTotal > 0 ? targetDistanceM / rawTotal : 1;

  const t0 = points.map((p) => p.time && new Date(p.time).getTime()).find((t) => t && Number.isFinite(t));
  const pts: TrackPoint[] = points.map((p, i) => {
    const t = p.time ? new Date(p.time).getTime() : NaN;
    return {
      distM: cumM[i] * scale,
      timeS: Number.isFinite(t) && t0 ? (t - t0) / 1000 : undefined,
      hr: p.hr,
      eleM: p.ele,
    };
  });

  let elevationGainM = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].ele;
    const b = points[i].ele;
    if (a !== undefined && b !== undefined && b > a) elevationGainM += b - a;
  }

  return {
    startedAt: toIsoOffset(points.find((p) => p.time)?.time),
    rawDistanceM: rawTotal,
    distanceM: rawTotal * scale,
    elevationGainM: Math.round(elevationGainM),
    splits: splitsFromPoints(pts),
  };
}

export function mergeGpxData(activity: Activity, points: GpxTrackPoint[]): Activity {
  const target = activity.distanceKm !== undefined ? activity.distanceKm * 1000 : undefined;
  const data = gpxToData(points, target);
  if (!data) return activity;
  return {
    ...activity,
    startedAt: activity.startedAt ?? data.startedAt,
    distanceKm: activity.distanceKm ?? data.distanceM / 1000,
    traceDistanceKm:
      activity.traceDistanceKm ?? (data.rawDistanceM > 0 ? data.rawDistanceM / 1000 : undefined),
    elevationM: activity.elevationM ?? data.elevationGainM,
    splits: activity.splits ?? data.splits,
  };
}
