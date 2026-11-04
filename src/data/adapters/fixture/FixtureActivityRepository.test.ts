import { existsSync } from 'node:fs';
import path from 'node:path';

import { ActivitySchema, type Activity } from '@/src/core/schemas';

import { FixtureActivityRepository } from './FixtureActivityRepository';

const base: Activity = {
  id: 'test-1',
  name: 'Sortie test',
  type: 'run',
  date: '2026-01-15',
  startTime: '08:00:00',
  durationMin: 42,
  distanceKm: 8.5,
  source: 'manual',
  aiEligible: true,
};

describe('FixtureActivityRepository', () => {
  it('sert les activités triées par date décroissante', async () => {
    const repo = new FixtureActivityRepository();
    const all = await repo.listAll();
    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    expect(all.map((a) => a.id)).toEqual(sorted.map((a) => a.id));
    for (const a of all) {
      expect(ActivitySchema.safeParse(a).success).toBe(true);
    }
  });

  it('listRecent coupe aux n plus récentes, listByDateRange filtre', async () => {
    const repo = new FixtureActivityRepository();
    const all = await repo.listAll();
    expect(await repo.listRecent(2)).toEqual(all.slice(0, 2));

    const ranged = await repo.listByDateRange('2024-01-01', '2024-12-31');
    expect(ranged.every((a) => a.date >= '2024-01-01' && a.date <= '2024-12-31')).toBe(true);
    expect(ranged).toEqual(all.filter((a) => a.date.startsWith('2024')));
  });

  it('add fait un upsert en mémoire, clear vide le dépôt', async () => {
    const repo = new FixtureActivityRepository();
    await repo.add(base);
    expect((await repo.listAll()).find((a) => a.id === base.id)).toEqual(base);
    await repo.add({ ...base, distanceKm: 9 });
    const all = await repo.listAll();
    expect(all.filter((a) => a.id === base.id)).toHaveLength(1);
    expect(all.find((a) => a.id === base.id)?.distanceKm).toBe(9);
    await repo.clear();
    expect(await repo.listAll()).toEqual([]);
  });
});

// ─── Données réelles (snapshot gitignoré — test sauté si absent) ─────────────

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const hasSnapshot = existsSync(snapshotPath);

(hasSnapshot ? describe : describe.skip)('real Strava export', () => {
  it('charge les 166 activités du snapshot', async () => {
    const all = await new FixtureActivityRepository().listAll();
    expect(all).toHaveLength(166);
    expect(all[0].date >= all[all.length - 1].date).toBe(true);
    expect(all.some((a) => a.type === 'swim')).toBe(true);
    expect(all.some((a) => a.type === 'other')).toBe(true);
  });
});
