import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { highlightOf } from '@/src/core/training/highlights';
import type { StravaActivity } from '@/src/core/types';
import { sportDerived, type SportSnapshot } from '@/src/ui/sportDerived';

const snapshotPath = path.join(__dirname, '../../fixtures/julien.snapshot.json');
const fixture: { activities: StravaActivity[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

const key = (activities: StravaActivity[], confirmedIds: string[] = []): SportSnapshot => ({
  stravaActivities: activities,
  confirmedIds,
  rejectedIds: [],
  names: {},
  goal: undefined,
});

describe('sportDerived', () => {
  it('même snapshot (références identiques) → même objet dérivé, calculé une fois', () => {
    const k = key([]);
    expect(sportDerived(k)).toBe(sportDerived(k));
  });

  it('toute entrée remplacée → recalcul', () => {
    const acts: StravaActivity[] = [];
    expect(sportDerived(key(acts))).not.toBe(sportDerived(key(acts, ['x'])));
  });

  it('raceDebrief mémorisé par id ; undefined sans id ou si introuvable', () => {
    const d = sportDerived(key([]));
    expect(d.raceDebrief(undefined)).toBeUndefined();
    expect(d.raceDebrief('race-nope')).toBeUndefined();
  });

  (fixture ? it : it.skip)('sur le snapshot réel : courses détectées, moment fort identique à highlightOf', () => {
    const acts = fixture!.activities;
    const d = sportDerived(key(acts));
    expect(d.races.length).toBeGreaterThan(0);

    const run = acts.find((a) => a.type === 'run' && a.date === '2026-10-15')!;
    const viaIndex = d.highlightFor(run);
    expect(viaIndex).toEqual(highlightOf(run, acts));
    // mémoïsation : même référence au deuxième appel
    expect(d.highlightFor(run)).toBe(viaIndex);
  });
});
