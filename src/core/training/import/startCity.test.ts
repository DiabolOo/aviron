import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { Activity } from '../../schemas';
import { detectRaces } from '../engine';
import { firstFitPoint, firstGpxPoint, nearestCityName } from './startCity';

describe('ville de départ (startCity)', () => {
  it('trouve la ville la plus proche dans cities1000 FR', () => {
    expect(nearestCityName({ lat: 49.26526, lon: 4.02853 })).toBe('Reims');
    expect(nearestCityName({ lat: 48.85341, lon: 2.3488 })).toBe('Paris');
  });

  it('lit le premier point de la trace GPX', () => {
    expect(
      firstGpxPoint([
        { lat: 49.26, lon: 4.02 },
        { lat: 49.27, lon: 4.03 },
      ]),
    ).toEqual({ lat: 49.26, lon: 4.02 });
    expect(firstGpxPoint([])).toBeUndefined();
  });

  it('lit le premier record FIT géolocalisé, en degrés ou en semicircles', () => {
    expect(firstFitPoint({ records: [{ position_lat: 49.26, position_long: 4.02 }] })).toEqual({
      lat: 49.26,
      lon: 4.02,
    });
    const semis = { lat: (49.26 / 180) * 2 ** 31, lon: (4.02 / 180) * 2 ** 31 };
    const p = firstFitPoint({ records: [{ position_lat: semis.lat, position_long: semis.lon }] });
    expect(p!.lat).toBeCloseTo(49.26, 4);
    expect(p!.lon).toBeCloseTo(4.02, 4);
    expect(firstFitPoint({ records: [{ distance: 100 }] })).toBeUndefined();
    expect(firstFitPoint({})).toBeUndefined();
  });
});

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const snapshot: { activities: Activity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

(snapshot ? describe : describe.skip)('startCity sur le snapshot réel', () => {
  it('Reims 2024 → « Reims » ; aucun entraînement n’a de startCity', () => {
    const reims = snapshot!.activities.find((a) => a.type === 'run' && a.date === '2024-10-13')!;
    expect(reims.startCity).toBe('Reims');

    const raceIds = new Set(detectRaces(snapshot!.activities).map((r) => r.activityId));
    const withCity = snapshot!.activities.filter((a) => a.startCity !== undefined);
    expect(withCity.length).toBeGreaterThan(0);
    for (const a of withCity) expect(raceIds.has(a.id)).toBe(true);
  });
});
