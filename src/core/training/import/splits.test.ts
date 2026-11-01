import { splitsFromPoints } from './splits';
import { gpxToData, mergeGpxData, type GpxTrackPoint } from './gpx';
import { mergeFitData, type FitData } from './fit';
import { ActivitySchema } from '../../schemas';

const baseActivity = ActivitySchema.parse({
  id: '1', name: 'Test', type: 'run', date: '2025-03-02', startTime: '10:00',
  durationMin: 20, distanceKm: 3,
});

describe('splitsFromPoints', () => {
  it('cuts 1 km splits with pace, avg HR and elevation', () => {
    const pts = [0, 1000, 2000, 2500].map((d, i) => ({
      distM: d, timeS: i * 300, hr: 140 + i, eleM: i * 10,
    }));
    const splits = splitsFromPoints(pts)!;
    expect(splits).toHaveLength(3);
    expect(splits[0]).toMatchObject({ km: 1, paceSec: 300, avgHr: 141, elevationGain: 10 });
    expect(splits[2].km).toBe(2.5);
    expect(splits[2].paceSec).toBe(600); // 300 s pour 500 m → 10:00/km
  });

  it('returns undefined without enough timed points', () => {
    expect(splitsFromPoints([{ distM: 0 }, { distM: 1500 }])).toBeUndefined();
  });
});

describe('fit records', () => {
  const fit: FitData = {
    sessions: [{ start_time: new Date('2025-03-02T09:00:00Z'), total_calories: 700, avg_heart_rate: 150 }],
    records: [
      { timestamp: new Date('2025-03-02T09:00:00Z'), distance: 0, heart_rate: 120, altitude: 100 },
      { timestamp: new Date('2025-03-02T09:05:00Z'), distance: 1000, heart_rate: 150, altitude: 110 },
      { timestamp: new Date('2025-03-02T09:10:00Z'), distance: 2000, heart_rate: 160, altitude: 105 },
      { timestamp: new Date('2025-03-02T09:15:00Z'), distance: 3000, heart_rate: 155, altitude: 115 },
    ],
    laps: [{ total_distance: 3000, total_timer_time: 600, avg_heart_rate: 99 }],
  };

  it('builds 1 km splits from records, not laps', () => {
    const merged = mergeFitData(baseActivity, fit);
    expect(merged.splits).toHaveLength(3);
    expect(merged.splits![0].paceSec).toBe(300);
    expect(merged.splits![0].avgHr).not.toBe(99); // pas les laps
    expect(merged.startedAt).toBe('2025-03-02T09:00:00+00:00');
    expect(merged.calories).toBe(700);
    expect(merged.avgHr).toBe(150);
  });

  it('falls back to laps when no record has distance', () => {
    const merged = mergeFitData(baseActivity, {
      laps: fit.laps,
      records: [{ timestamp: new Date(), heart_rate: 140 }],
    });
    expect(merged.splits).toHaveLength(1);
    expect(merged.splits![0].avgHr).toBe(99);
  });
});

describe('gpx', () => {
  // ~1,11 km par 0,01° de latitude
  const pts: GpxTrackPoint[] = [0, 0.01, 0.02, 0.03].map((lat, i) => ({
    lat: 48 + lat, lon: 2, ele: 50 + i * 5, time: new Date(`2025-03-02T09:0${i}:00Z`),
  }));

  it('normalizes haversine distance to the CSV distance and reads start time', () => {
    const data = gpxToData(pts, 3300)!;
    expect(data.distanceM).toBeCloseTo(3300, 3);
    expect(data.startedAt).toBe('2025-03-02T09:00:00+00:00');
    expect(data.splits!.length).toBeGreaterThanOrEqual(3);
    expect(data.elevationGainM).toBe(15);
  });

  it('merges into an activity without overwriting CSV fields', () => {
    const merged = mergeGpxData({ ...baseActivity, distanceKm: 3.3 }, pts);
    expect(merged.distanceKm).toBe(3.3);
    expect(merged.splits!.length).toBeGreaterThanOrEqual(3);
    expect(merged.startedAt).toBe('2025-03-02T09:00:00+00:00');
  });
});
