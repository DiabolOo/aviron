import type { Activity } from '../../schemas';
import { dedupeActivities } from './dedupeActivities';

/** Crée une activité minimale. `startedAt` en ISO offset pour les tests précis. */
function act(
  id: string,
  source: Activity['source'],
  startedAt: string,
  distanceKm?: number,
  durationMin = 30,
  type: Activity['type'] = 'run',
): Activity {
  const date = startedAt.slice(0, 10);
  return {
    id,
    name: id,
    type,
    date,
    startTime: startedAt.slice(11, 19),
    startedAt,
    durationMin,
    distanceKm,
    source,
    aiEligible: source !== 'strava',
  };
}

describe('dedupeActivities — invariants de base', () => {
  it('conserve une activité seule', () => {
    const r = dedupeActivities([act('a', 'manual', '2026-05-01T08:00:00+00:00', 10)]);
    expect(r.kept).toHaveLength(1);
    expect(r.discarded).toHaveLength(0);
  });

  it("ne mute pas le tableau d'entrée", () => {
    const input = [
      act('a', 'strava', '2026-05-01T08:00:00+00:00', 10),
      act('b', 'coros', '2026-05-01T08:00:30+00:00', 10),
    ];
    const copy = [...input];
    dedupeActivities(input);
    expect(input).toEqual(copy);
  });

  it("résultat déterministe quel que soit l'ordre d'entrée", () => {
    const a = act('a', 'coros', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'strava', '2026-05-01T08:00:30+00:00', 10);
    const r1 = dedupeActivities([a, b]);
    const r2 = dedupeActivities([b, a]);
    expect(r1.kept.map((x) => x.id).sort()).toEqual(r2.kept.map((x) => x.id).sort());
    expect(r1.discarded.map((x) => x.id).sort()).toEqual(r2.discarded.map((x) => x.id).sort());
  });
});

describe('dedupeActivities — choisit non-Strava', () => {
  it('garde coros, écarte strava (même distance, écart < 2 min)', () => {
    const a = act('strava1', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const b = act('coros1', 'coros', '2026-05-01T08:00:30+00:00', 10);
    const { kept, discarded } = dedupeActivities([a, b]);
    expect(kept.map((x) => x.id)).toEqual(['coros1']);
    expect(discarded.map((x) => x.id)).toEqual(['strava1']);
  });

  it("ne complète pas l'enregistrement gardé avec des champs de la copie Strava", () => {
    const strava = act('s', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const coros = act('c', 'coros', '2026-05-01T08:00:00+00:00', 10);
    const { kept } = dedupeActivities([strava, coros]);
    expect(kept[0].id).toBe('c');
    // On vérifie que le gardé est l'objet coros tel quel (pas de fusion de champs)
    expect(kept[0]).toEqual(coros);
  });
});

describe('dedupeActivities — ordre de priorité entre non-Strava', () => {
  it('coros > apple_health', () => {
    const a = act('a', 'apple_health', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10);
    expect(dedupeActivities([a, b]).kept[0].id).toBe('b');
  });

  it('garmin > file', () => {
    const a = act('a', 'garmin', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'file', '2026-05-01T08:00:30+00:00', 10);
    expect(dedupeActivities([a, b]).kept[0].id).toBe('a');
  });

  it('apple_health > phone', () => {
    const a = act('a', 'phone', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'apple_health', '2026-05-01T08:00:30+00:00', 10);
    expect(dedupeActivities([a, b]).kept[0].id).toBe('b');
  });

  it('health_connect = apple_health → départage par richesse de données', () => {
    const a: Activity = { ...act('a', 'apple_health', '2026-05-01T08:00:00+00:00', 10), hrStream: [150, 155, 160] };
    const b = act('b', 'health_connect', '2026-05-01T08:00:30+00:00', 10);
    expect(dedupeActivities([a, b]).kept[0].id).toBe('a');
  });
});

describe('dedupeActivities — deux enregistrements de la même source ne fusionnent jamais', () => {
  it('deux coros : deux séances conservées', () => {
    const a = act('a', 'coros', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10);
    const { kept } = dedupeActivities([a, b]);
    expect(kept).toHaveLength(2);
  });

  it('deux strava : deux séances conservées (sources identiques)', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'strava', '2026-05-01T08:01:00+00:00', 10);
    expect(dedupeActivities([a, b]).kept).toHaveLength(2);
  });
});

describe('dedupeActivities — familles différentes', () => {
  it('course + vélo au même moment : deux séances distinctes', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10, 30, 'run');
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10, 30, 'ride');
    expect(dedupeActivities([a, b]).kept).toHaveLength(2);
  });
});

describe('dedupeActivities — seuils aux limites', () => {
  it('écart 1:59 → fusion (< 2 min)', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'coros', '2026-05-01T08:01:59+00:00', 10);
    expect(dedupeActivities([a, b]).kept).toHaveLength(1);
  });

  it('écart exactement 2:00 → PAS de fusion (≥ 2 min)', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'coros', '2026-05-01T08:02:00+00:00', 10);
    expect(dedupeActivities([a, b]).kept).toHaveLength(2);
  });

  it("distance 2,9 % d'écart → fusion (< 3 %)", () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10.0);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10.29);
    expect(dedupeActivities([a, b]).kept).toHaveLength(1);
  });

  it('distance exactement 3 % → fusion (≤ 3 %)', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10.0);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10.3);
    expect(dedupeActivities([a, b]).kept).toHaveLength(1);
  });

  it('distance > 3 % → PAS de fusion', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10.0);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', 10.31);
    expect(dedupeActivities([a, b]).kept).toHaveLength(2);
  });

  it('pas de distance des deux côtés : compare la durée', () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', undefined, 30);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', undefined, 30.5);
    expect(dedupeActivities([a, b]).kept).toHaveLength(1);
    expect(dedupeActivities([a, b]).kept[0].source).toBe('coros');
  });

  it("un avec distance et l'autre sans : PAS de fusion", () => {
    const a = act('a', 'strava', '2026-05-01T08:00:00+00:00', 10);
    const b = act('b', 'coros', '2026-05-01T08:00:30+00:00', undefined);
    expect(dedupeActivities([a, b]).kept).toHaveLength(2);
  });
});

describe('dedupeActivities — invariant Strava ⇒ aiEligible false', () => {
  it('toute activité source strava dans la sortie a aiEligible false', () => {
    const acts = [
      act('a', 'strava', '2026-05-01T08:00:00+00:00', 10),
      act('b', 'coros', '2026-05-01T09:00:00+00:00', 8), // séance distincte
    ];
    const { kept } = dedupeActivities(acts);
    const stravaActs = kept.filter((a) => a.source === 'strava');
    for (const a of stravaActs) expect(a.aiEligible).toBe(false);
  });
});
