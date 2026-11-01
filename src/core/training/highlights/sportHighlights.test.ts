import { medianComparisonFr } from '../insights/copy.fr';
import { addDays } from '../engine/periods';
import { comparablesIndex, highlightOf, medianComparison, type HighlightActivity } from './highlightOf';

const TODAY = '2026-10-15';

function act(id: string, type: string, date: string, over: Partial<HighlightActivity> = {}): HighlightActivity {
  return { id, type, date, durationMin: 60, ...over };
}

/** `count` séances hebdomadaires identiques, la plus récente 7 jours avant TODAY. */
function weekly(type: string, count: number, over: Partial<HighlightActivity> = {}): HighlightActivity[] {
  return Array.from({ length: count }, (_, i) => act(`h${i}`, type, addDays(TODAY, -7 * (i + 1)), over));
}

const ride = (over: Partial<HighlightActivity>) => act('now', 'ride', TODAY, { distanceKm: 30, durationMin: 60, ...over });

describe('moments forts — vélo', () => {
  const history = weekly('ride', 60, { distanceKm: 30, durationMin: 60, elevationM: 200 });

  it('plus longue sortie, avec 1 % d’avance minimum', () => {
    const h = highlightOf(ride({ distanceKm: 45, durationMin: 90 }), history)!;
    expect(h.kind).toBe('longest');
    expect(h.title).toBe('Ta plus longue sortie');
    expect(highlightOf(ride({ distanceKm: 30.2, durationMin: 60.4, elevationM: 200 }), history)).toBeNull();
  });

  it('meilleure vitesse sur distance comparable (km/h), avec 1 % d’avance', () => {
    const h = highlightOf(ride({ durationMin: 55, elevationM: 200 }), history)!;
    expect(h.kind).toBe('fastest_speed');
    expect(h.tone).toBe('flame');
    expect(h.value).toBe('32,7 km/h');
    expect(highlightOf(ride({ durationMin: 59.8, elevationM: 200 }), history)).toBeNull();
  });

  it('exige 5 sorties comparables', () => {
    expect(highlightOf(ride({ durationMin: 55 }), weekly('ride', 4, { distanceKm: 30, durationMin: 60 }))).toBeNull();
  });

  it('plus gros dénivelé', () => {
    const h = highlightOf(ride({ elevationM: 320 }), history)!;
    expect(h.kind).toBe('biggest_climb');
    expect(h.value).toBe('320 m');
    expect(highlightOf(ride({ elevationM: 202 }), history)).toBeNull();
  });
});

describe('moments forts — nage', () => {
  const history = weekly('swim', 60, { distanceKm: 1.5, durationMin: 40 });
  const swim = (over: Partial<HighlightActivity>) => act('now', 'swim', TODAY, { distanceKm: 1.5, durationMin: 40, ...over });

  it('plus longue séance', () => {
    const h = highlightOf(swim({ distanceKm: 2.5, durationMin: 66 }), history)!;
    expect(h.kind).toBe('longest');
    expect(h.title).toBe('Ta plus longue séance');
  });

  it('meilleure allure au 100 m', () => {
    const h = highlightOf(swim({ durationMin: 35 }), history)!;
    expect(h.kind).toBe('fastest_swim');
    expect(h.value).toBe('2:20 /100 m');
  });
});

describe('moments forts — musculation', () => {
  const strength = (over: Partial<HighlightActivity> = {}) => act('now', 'strength', TODAY, { durationMin: 45, ...over });

  it('retour après au moins 14 jours sans muscu, même si d’autres sports ont eu lieu', () => {
    const history = [
      ...[20, 27, 34].map((d) => act(`s${d}`, 'strength', addDays(TODAY, -d), { durationMin: 45 })),
      act('r', 'run', addDays(TODAY, -2), { distanceKm: 8 }),
    ];
    const h = highlightOf(strength(), history)!;
    expect(h.kind).toBe('return');
    expect(h.value).toBe('20 jours');
    expect(h.detail).toMatch(/séance précédente/);
    const recent = [act('s13', 'strength', addDays(TODAY, -13), { durationMin: 45 })];
    expect(highlightOf(strength(), recent)?.kind).not.toBe('return');
  });

  it('séance la plus longue', () => {
    const h = highlightOf(strength({ durationMin: 62 }), weekly('strength', 14, { durationMin: 45 }))!;
    expect(h.kind).toBe('longest_session');
    expect(h.value).toBe('1 h 02');
  });

  it('régularité du mois : une séance dans chacune des 4 dernières semaines', () => {
    const h = highlightOf(strength(), weekly('strength', 8, { durationMin: 45 }))!;
    expect(h.kind).toBe('steady_month');
    expect(h.value).toBe('4 semaines');
    const gap = weekly('strength', 8, { durationMin: 45 }).filter((a) => a.id !== 'h1');
    expect(highlightOf(strength(), gap)).toBeNull();
  });
});

describe('moments forts — marche', () => {
  const history = weekly('walk', 20, { distanceKm: 5, durationMin: 60, elevationM: 40 });
  const walk = (over: Partial<HighlightActivity>) => act('now', 'walk', TODAY, { distanceKm: 5, durationMin: 60, elevationM: 40, ...over });

  it('plus longue, puis dénivelé', () => {
    expect(highlightOf(walk({ distanceKm: 8, durationMin: 96 }), history)?.kind).toBe('longest');
    const climb = highlightOf(walk({ elevationM: 120 }), history)!;
    expect(climb.kind).toBe('biggest_climb');
    expect(climb.value).toBe('120 m');
  });

  it('un dénivelé de moins de 50 m n’est pas un moment fort', () => {
    expect(highlightOf(walk({ elevationM: 45 }), weekly('walk', 20, { distanceKm: 5, durationMin: 60, elevationM: 10 }))).toBeNull();
  });
});

describe('garde-fous communs', () => {
  it('jamais le mot « record »', () => {
    const cases: [HighlightActivity, HighlightActivity[]][] = [
      [ride({ distanceKm: 45, durationMin: 90 }), weekly('ride', 60, { distanceKm: 30 })],
      [ride({ durationMin: 55 }), weekly('ride', 60, { distanceKm: 30 })],
      [act('now', 'strength', TODAY, { durationMin: 62 }), weekly('strength', 14, { durationMin: 45 })],
      [act('now', 'walk', TODAY, { distanceKm: 8, durationMin: 96 }), weekly('walk', 20, { distanceKm: 5 })],
    ];
    for (const [a, history] of cases) {
      const h = highlightOf(a, history)!;
      expect(`${h.title} ${h.detail}`).not.toMatch(/record/i);
    }
  });

  it('sport « autre » : aucun moment fort', () => {
    expect(highlightOf(act('now', 'other', TODAY, { distanceKm: 9 }), weekly('other', 20, { distanceKm: 3 }))).toBeNull();
  });
});

describe('comparaison à la médiane des 8 dernières semaines', () => {
  it('distance pour les sports à distance : écart en % et médiane', () => {
    const history = weekly('run', 8, { distanceKm: 10 });
    const c = medianComparison(act('now', 'run', TODAY, { distanceKm: 12 }), comparablesIndex(history))!;
    expect(c).toMatchObject({ median: 10, deltaPct: 20, unit: 'km', count: 8 });
    expect(medianComparisonFr({ ...c, weeks: 8 })).toBe('+20 % par rapport à ta médiane des 8 dernières semaines (10,0 km)');
  });

  it('durée pour la musculation, même sport uniquement', () => {
    const history = [...weekly('strength', 8, { durationMin: 60 }), ...weekly('run', 8, { distanceKm: 40 }).map((a, i) => ({ ...a, id: `r${i}` }))];
    const c = medianComparison(act('now', 'strength', TODAY, { durationMin: 45 }), comparablesIndex(history))!;
    expect(c).toMatchObject({ median: 60, deltaPct: -25, unit: 'min' });
    expect(medianComparisonFr({ ...c, weeks: 8 })).toBe('−25 % par rapport à ta médiane des 8 dernières semaines (1 h 00)');
  });

  it('proche de la médiane : formulation neutre ; moins de 3 séances : rien', () => {
    const history = weekly('run', 8, { distanceKm: 10 });
    const c = medianComparison(act('now', 'run', TODAY, { distanceKm: 10.1 }), comparablesIndex(history))!;
    expect(medianComparisonFr({ ...c, weeks: 8 })).toBe('Dans ta médiane des 8 dernières semaines (10,0 km)');
    expect(medianComparison(act('now', 'run', TODAY, { distanceKm: 10 }), comparablesIndex(weekly('run', 2, { distanceKm: 10 })))).toBeNull();
  });

  it('seules les 8 dernières semaines comptent', () => {
    const old = Array.from({ length: 6 }, (_, i) => act(`o${i}`, 'run', addDays(TODAY, -70 - i), { distanceKm: 30 }));
    const recent = weekly('run', 8, { distanceKm: 10 }).slice(0, 4);
    const c = medianComparison(act('now', 'run', TODAY, { distanceKm: 10 }), comparablesIndex([...old, ...recent]))!;
    expect(c.median).toBe(10);
    expect(c.count).toBe(4);
  });
});
