// Zones de FC en % de la FC max (FC max configurable ou estimée).

export interface HrZone {
  zone: 1 | 2 | 3 | 4 | 5;
  minBpm: number;
  maxBpm: number;
}

const ZONE_BOUNDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.01] as const;

export function hrZones(maxHr: number): HrZone[] {
  return ([1, 2, 3, 4, 5] as const).map((zone) => ({
    zone,
    minBpm: Math.round(maxHr * ZONE_BOUNDS[zone - 1]),
    maxBpm: Math.round(maxHr * ZONE_BOUNDS[zone]) - 1,
  }));
}

export function zoneOf(hr: number, zones: HrZone[]): 1 | 2 | 3 | 4 | 5 {
  for (const z of zones) {
    if (hr >= z.minBpm && hr <= z.maxBpm) return z.zone;
  }
  return hr < zones[0].minBpm ? 1 : 5;
}

/** Tanaka : 208 − 0,7 × âge. */
export function estimateMaxHr(ageYears: number): number {
  return Math.round(208 - 0.7 * ageYears);
}
