import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { Activity } from '../../schemas';

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const snapshot: { activities: Activity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

// Splits Strava de la course du 15 octobre 2026 (km 1 à 9), en secondes.
const STRAVA = [313, 312, 286, 308, 313, 316, 290, 334, 220];

(snapshot ? describe : describe.skip)('splits du snapshot réel', () => {
  it('course du 15 octobre 2026 : écart ≤ 5 s par km avec Strava, km 9 ≈ 3:40 (et non 7:10)', () => {
    const run = snapshot!.activities.find((a) => a.type === 'run' && a.date === '2026-10-15')!;
    const paces = run.splits!.slice(0, 9).map((s) => s.paceSec);
    paces.forEach((p, i) => expect(Math.abs(p - STRAVA[i])).toBeLessThanOrEqual(5));
    expect(run.splits![8].paceSec).toBeLessThan(300);
  });
});
