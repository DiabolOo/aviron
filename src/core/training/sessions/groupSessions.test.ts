import type { Activity } from '../../schemas';
import { dedupeActivities } from '../import/dedupeActivities';
import { aiEligibleView } from '../import/aiEligibleView';
import { groupSessions } from './groupSessions';
import { resolveSession } from './resolveSession';
import type { GroupOverride } from './types';

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Crée une activité avec startedAt précis.
 * durationMin = durée écoulée (fin = startedAt + durationMin * 60 s).
 */
function act(
  id: string,
  type: Activity['type'],
  startedAt: string,
  durationMin: number,
  distanceKm?: number,
  avgHr?: number,
  source: Activity['source'] = 'coros',
): Activity {
  return {
    id,
    name: id,
    type,
    date: startedAt.slice(0, 10),
    startTime: startedAt.slice(11, 19),
    startedAt,
    durationMin,
    distanceKm,
    avgHr,
    source,
    aiEligible: source !== 'strava',
  };
}

/** Quelques instants de référence (tous en Europe/Paris = UTC+1 en novembre = UTC+2 en été) */
// Lundi 2026-11-02, 08:00 Europe/Paris = 07:00 UTC
const T0 = '2026-11-02T07:00:00+00:00';

function minutesAfter(iso: string, min: number): string {
  const ms = Date.parse(iso) + min * 60000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

// ─── Regroupement de base ─────────────────────────────────────────────────────

describe('groupSessions — triplé échauffement/bloc/retour', () => {
  // Échauffement 4 min, puis bloc 6,5 min (gap 0), puis retour 5 min (gap 0)
  const warm = act('w', 'run', T0, 4, 2.0);
  const main = act('m', 'run', minutesAfter(T0, 4), 6.5, 3.3, 165);
  const cool = act('c', 'run', minutesAfter(T0, 10.5), 5, 2.6);

  it('forme une seule séance de 3 activités', () => {
    const { sessions } = groupSessions([warm, main, cool]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].activityIds).toHaveLength(3);
  });

  it('id stable = s_ + id de la première activité', () => {
    const { sessions } = groupSessions([cool, main, warm]); // ordre mélangé
    expect(sessions[0].id).toBe('s_w');
  });

  it('distance totale = somme des distanceKm × 1000', () => {
    const { sessions } = groupSessions([warm, main, cool]);
    // 2.0 + 3.3 + 2.6 = 7.9 km → 7900 m (arrondi)
    expect(sessions[0].distanceM).toBe(7900);
  });

  it('FC moyenne pondérée par le temps en mouvement (seul main a de la FC)', () => {
    const { sessions } = groupSessions([warm, main, cool]);
    // Seul main a avgHr=165 → moyenne = 165
    expect(sessions[0].avgHr).toBe(165);
  });
});

describe('groupSessions — deux nages séparées de moins de 2 min', () => {
  it('forme une seule séance', () => {
    const a = act('sw1', 'swim', T0, 20, 1.0);
    const b = act('sw2', 'swim', minutesAfter(T0, 20.5), 20, 1.0); // gap 0.5 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(1);
  });
});

describe('groupSessions — deux courses séparées de 2.2 min', () => {
  it('forme une seule séance', () => {
    const a = act('r1', 'run', T0, 10, 2.0);
    const b = act('r2', 'run', minutesAfter(T0, 12.2), 10, 2.0); // gap 2.2 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(1);
  });
});

describe('groupSessions — deux vélos séparés de 16.2 min', () => {
  it('forme DEUX séances (seuil 15 min dépassé)', () => {
    const a = act('b1', 'ride', T0, 60, 25);
    const b = act('b2', 'ride', minutesAfter(T0, 76.2), 60, 25); // gap 16.2 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });
});

describe('groupSessions — familles différentes', () => {
  it('course puis muscu à 1.8 min → deux séances (familles différentes)', () => {
    const a = act('r1', 'run', T0, 40, 8);
    const b = act('s1', 'strength', minutesAfter(T0, 41.8), 30); // gap 1.8 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });

  it('vélo puis course à 12.8 min → jamais regroupés (multisport)', () => {
    const a = act('b1', 'ride', T0, 60, 20);
    const b = act('r1', 'run', minutesAfter(T0, 72.8), 30, 6); // gap 12.8 min < 15 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });

  it('vélo puis course à 0 min → jamais regroupés (multisport)', () => {
    const a = act('b1', 'ride', T0, 60, 20);
    const b = act('r1', 'run', minutesAfter(T0, 60), 30, 6); // gap 0 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });
});

describe('groupSessions — même jour local', () => {
  it('23:50 puis 00:10 (minuit local) → deux séances (jours différents)', () => {
    // 2026-11-02 23:50 Europe/Paris = 22:50 UTC
    const a = act('a', 'run', '2026-11-02T22:50:00+00:00', 5, 1.0);
    // 2026-11-03 00:10 Europe/Paris = 23:10 UTC du 02-11
    const b = act('b', 'run', '2026-11-02T23:10:00+00:00', 5, 1.0); // gap 20 min UTC mais jours locaux différents
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });

  it("même jour après changement d'heure : même jour local → peut être groupé", () => {
    // Passage à l'heure d'hiver 2026 : dimanche 25 oct 2026 à 3h → 2h (UTC+1)
    // 25 oct 2026 10:00 Europe/Paris = 09:00 UTC
    // 25 oct 2026 10:12 Europe/Paris = 09:12 UTC — gap 12 min, même jour
    const a = act('a', 'run', '2026-10-25T09:00:00+00:00', 5);
    const b = act('b', 'run', '2026-10-25T09:17:00+00:00', 5); // gap 12 min
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(1);
  });
});

describe('groupSessions — dépassement 4 heures', () => {
  it('enchaînement qui dépasserait 4 h : coupé à la 4e heure', () => {
    // a: 0 min de durée, b démarre à 3h55, durée 10 min → total 4h05 → coupé
    const a = act('a', 'run', T0, 235, 40); // 3h55 de durée
    const b = act('b', 'run', minutesAfter(T0, 235), 10, 2); // gap 0, mais 4h05 total
    const { sessions } = groupSessions([a, b]);
    expect(sessions).toHaveLength(2);
  });
});

describe('groupSessions — chaînage A→B→C', () => {
  it('A→B ≤ 15 min et B→C ≤ 15 min → une seule séance', () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 15), 10); // gap 5 min depuis fin(a) = T0+10
    const c = act('c', 'run', minutesAfter(T0, 30), 10); // gap 5 min depuis fin(b)
    const { sessions } = groupSessions([a, b, c]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].activityIds).toEqual(['a', 'b', 'c']);
  });
});

// ─── Overrides ───────────────────────────────────────────────────────────────

describe('groupSessions — override split', () => {
  it("force deux séances même si l'écart est < 15 min", () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 10), 10); // gap 0 → serait groupé sans split
    const overrides: GroupOverride[] = [{ type: 'split', activityId: 'b' }];
    const { sessions } = groupSessions([a, b], overrides);
    expect(sessions).toHaveLength(2);
  });
});

describe('groupSessions — override merge', () => {
  it("accepté : deux courses même famille → une séance, peu importe l'écart", () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 60), 10); // gap 50 min → ne serait pas groupé
    const overrides: GroupOverride[] = [{ type: 'merge', activityIds: ['a', 'b'] }];
    const { sessions, ignoredMergeOverrides } = groupSessions([a, b], overrides);
    expect(ignoredMergeOverrides).toHaveLength(0);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].activityIds).toHaveLength(2);
  });

  it('refusé : familles différentes → ignoré et listé', () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'ride', minutesAfter(T0, 10), 10);
    const overrides: GroupOverride[] = [{ type: 'merge', activityIds: ['a', 'b'] }];
    const { sessions, ignoredMergeOverrides } = groupSessions([a, b], overrides);
    expect(ignoredMergeOverrides).toHaveLength(1);
    expect(sessions).toHaveLength(2);
  });
});

describe('groupSessions — override role', () => {
  it('attribue les rôles demandés à la séance', () => {
    const warm = act('w', 'run', T0, 4, 2.0);
    const main = act('m', 'run', minutesAfter(T0, 4), 6.5, 3.3);
    const overrides: GroupOverride[] = [
      { type: 'role', activityId: 'w', role: 'warmup' },
      { type: 'role', activityId: 'm', role: 'main' },
    ];
    const { sessions } = groupSessions([warm, main], overrides);
    expect(sessions[0].roles?.w).toBe('warmup');
    expect(sessions[0].roles?.m).toBe('main');
  });
});

describe('groupSessions — neverGroup', () => {
  it('chaque activité devient sa propre séance', () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 10), 10); // serait groupé normalement
    const { sessions } = groupSessions([a, b], [], { neverGroup: true });
    expect(sessions).toHaveLength(2);
  });

  it('les merges restent appliqués même avec neverGroup', () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 60), 10);
    const overrides: GroupOverride[] = [{ type: 'merge', activityIds: ['a', 'b'] }];
    const { sessions } = groupSessions([a, b], overrides, { neverGroup: true });
    expect(sessions).toHaveLength(1);
  });
});

// ─── Propriétés de la fonction ────────────────────────────────────────────────

describe('groupSessions — déterminisme et intégrité', () => {
  it("déterministe : ordre d'entrée mélangé → même résultat", () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 10), 10);
    const c = act('c', 'run', minutesAfter(T0, 25), 10); // 5 min après fin b
    const r1 = groupSessions([a, b, c]);
    const r2 = groupSessions([c, a, b]);
    expect(r1.sessions.map((s) => s.id)).toEqual(r2.sessions.map((s) => s.id));
    expect(r1.sessions.map((s) => s.activityIds.sort())).toEqual(r2.sessions.map((s) => s.activityIds.sort()));
  });

  it("ne mute pas le tableau d'entrée", () => {
    const input = [act('a', 'run', T0, 10), act('b', 'run', minutesAfter(T0, 10), 10)];
    const copy = JSON.stringify(input);
    groupSessions(input);
    expect(JSON.stringify(input)).toBe(copy);
  });

  it('id stable : même si les activités sont dans un ordre différent', () => {
    const a = act('a', 'run', T0, 10);
    const b = act('b', 'run', minutesAfter(T0, 5), 10);
    // 'a' est chronologiquement le premier
    expect(groupSessions([b, a]).sessions[0].id).toBe('s_a');
  });

  it("nombre de séances ≤ nombre d'activités", () => {
    const acts = Array.from({ length: 5 }, (_, i) =>
      act(`r${i}`, 'run', minutesAfter(T0, i * 20), 10),
    );
    const { sessions } = groupSessions(acts);
    expect(sessions.length).toBeLessThanOrEqual(acts.length);
  });

  it('volume total identique avant et après regroupement', () => {
    const a = act('a', 'run', T0, 10, 2.0);
    const b = act('b', 'run', minutesAfter(T0, 10), 6.5, 3.3);
    const c = act('c', 'run', minutesAfter(T0, 20), 5, 2.6);
    const { sessions } = groupSessions([a, b, c]);
    const totalDistM = [a, b, c].reduce((s, x) => s + (x.distanceKm ?? 0) * 1000, 0);
    const sessionDistM = sessions.reduce((s, x) => s + (x.distanceM ?? 0), 0);
    expect(sessionDistM).toBeCloseTo(totalDistM, 0);
  });
});

// ─── aiEligible ──────────────────────────────────────────────────────────────

describe('groupSessions — aiEligible de la séance', () => {
  it('toutes éligibles → séance éligible', () => {
    const a = act('a', 'run', T0, 10, 2, undefined, 'coros');
    const b = act('b', 'run', minutesAfter(T0, 10), 10, 2, undefined, 'garmin');
    const { sessions } = groupSessions([a, b]);
    expect(sessions[0].aiEligible).toBe(true);
  });

  it('une seule non éligible (strava) → séance non éligible', () => {
    const a = act('a', 'run', T0, 10, 2, undefined, 'coros');
    const b = act('b', 'run', minutesAfter(T0, 10), 10, 2, undefined, 'strava');
    const { sessions } = groupSessions([a, b]);
    expect(sessions[0].aiEligible).toBe(false);
  });
});

// ─── resolveSession ───────────────────────────────────────────────────────────

describe('resolveSession', () => {
  const a = act('a1', 'run', T0, 10);
  const b = act('b1', 'run', minutesAfter(T0, 10), 10);
  const { sessions } = groupSessions([a, b]);

  it('résout un id de séance directement', () => {
    expect(resolveSession(sessions, 's_a1')?.id).toBe('s_a1');
  });

  it("résout un id d'activité vers sa séance", () => {
    expect(resolveSession(sessions, 'a1')?.id).toBe('s_a1');
    expect(resolveSession(sessions, 'b1')?.id).toBe('s_a1');
  });

  it('retourne undefined pour un id inconnu', () => {
    expect(resolveSession(sessions, 'unknown')).toBeUndefined();
  });
});

// ─── Orchestration : import → dedupe → groupSessions → aiEligibleView ────────

describe('orchestration complète', () => {
  it('pipeline sur un jeu mélangé Strava, COROS et téléphone', () => {
    const run1coros = act('c1', 'run', T0, 10, 8, undefined, 'coros');
    // Doublon Strava de run1coros : même distance, départ 30 s après
    const run1strava = act('s1', 'run', minutesAfter(T0, 0.5), 10, 8, undefined, 'strava');
    // Deuxième séance : écart 60 min du groupe ci-dessus
    const run2phone = act('p1', 'run', minutesAfter(T0, 70), 20, 5, undefined, 'phone');
    // Course Strava indépendante (heure complètement différente) → non éligible
    const run3strava = act('s2', 'run', minutesAfter(T0, 180), 30, 10, undefined, 'strava');

    const rawActivities = [run1coros, run1strava, run2phone, run3strava];

    // 1. Déduplication : run1strava est doublon de run1coros → écarté
    const { kept, discarded } = dedupeActivities(rawActivities);
    expect(discarded.map((a) => a.id)).toContain('s1');
    expect(kept.map((a) => a.id)).not.toContain('s1');

    // 2. Regroupement (run1coros et run2phone sont dans des séances distinctes : écart > 60 min)
    const { sessions } = groupSessions(kept);
    expect(sessions).toHaveLength(3); // c1, p1, s2

    // 3. Vue IA : exclut run3strava (aiEligible: false) et sa séance
    const view = aiEligibleView(kept, sessions);
    expect(view.activities.map((a) => a.id)).not.toContain('s2');
    const viewSessionIds = view.sessions.map((s) => s.id);
    expect(viewSessionIds).not.toContain('s_s2');

    // 4. Vérification : résumé identique avec ou sans Strava au départ
    const keptWithoutStrava = rawActivities.filter((a) => a.source !== 'strava');
    const { sessions: sessionsNoStrava } = groupSessions(keptWithoutStrava);
    const viewNoStrava = aiEligibleView(keptWithoutStrava, sessionsNoStrava);

    expect(view.activities.map((a) => a.id).sort()).toEqual(
      viewNoStrava.activities.map((a) => a.id).sort(),
    );
  });
});
