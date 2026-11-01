import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { formatSecAsClock } from '../../sportFormat';
import { addDays } from '../engine/periods';
import { highlightOf, type HighlightActivity } from './highlightOf';

const TODAY = '2026-10-15';

/** Sortie à allure constante, une seule valeur de pace par km. */
function run(
  id: string,
  date: string,
  distanceKm: number,
  paceSec: number,
  splitPaces?: number[],
): HighlightActivity {
  const paces = splitPaces ?? Array.from({ length: Math.floor(distanceKm) }, () => paceSec);
  return {
    id,
    type: 'run',
    date,
    distanceKm,
    durationMin: (distanceKm * paceSec) / 60,
    movingTimeSec: Math.round(distanceKm * paceSec),
    splits: paces.map((p, i) => ({ km: i + 1, paceSec: p })),
  };
}

/** Historique régulier : une sortie de 8 km à 5:30 toutes les semaines depuis 14 mois (rien de plus long ni de plus rapide). */
function history(count = 60, distanceKm = 8, paceSec = 330): HighlightActivity[] {
  return Array.from({ length: count }, (_, i) => run(`h${i}`, addDays(TODAY, -7 * (i + 1)), distanceKm, paceSec));
}

/** Allures irrégulières : aucune des règles « stable » / « negative split » ne se déclenche. */
const ZIGZAG = [330, 300, 340, 310, 345, 305, 335, 315];

describe('highlightOf', () => {
  it('a. sortie la plus rapide sur distance comparable (flamme)', () => {
    const a = run('now', TODAY, 8, 300, ZIGZAG);
    const h = highlightOf(a, history())!;
    expect(h.kind).toBe('fastest_comparable');
    expect(h.tone).toBe('flame');
    expect(h.value).toBe('5:00 /km');
    expect(h.detail).toMatch(/12 mois/);
    expect(`${h.title} ${h.detail}`).not.toMatch(/record/i);
  });

  it('a. exige 5 sorties comparables et un historique qui couvre 12 mois', () => {
    const a = run('now', TODAY, 8, 300, ZIGZAG);
    expect(highlightOf(a, history(4))?.kind).not.toBe('fastest_comparable');
    // 20 semaines d'historique seulement : la fenêtre de 12 mois n'est pas couverte
    expect(highlightOf(a, history(20))?.kind).not.toBe('fastest_comparable');
    // une sortie comparable plus rapide : pas de carte a
    const faster = [...history(), run('fast', addDays(TODAY, -40), 8.2, 290)];
    expect(highlightOf(a, faster)?.kind).not.toBe('fastest_comparable');
  });

  it('a. ignore les sorties hors de ±20 % de distance et d’un autre sport', () => {
    const a = run('now', TODAY, 8, 300, ZIGZAG);
    const noise: HighlightActivity[] = [
      ...history(),
      { ...run('far', addDays(TODAY, -30), 15, 250), type: 'run' },
      { ...run('bike', addDays(TODAY, -31), 8, 200), type: 'ride' },
    ];
    expect(highlightOf(a, noise)?.kind).toBe('fastest_comparable');
  });

  it('b. plus longue sortie depuis 12 semaines (flamme)', () => {
    const a = run('now', TODAY, 12, 330, [330, 345, 320, 340, 325, 335, 328, 342, 322, 338, 330, 336]);
    const h = highlightOf(a, history())!;
    expect(h.kind).toBe('longest');
    expect(h.tone).toBe('flame');
    expect(h.value).toBe('12,0 km');
    expect(h.detail).toMatch(/12 dernières semaines/);
  });

  it('b. sans assez de sorties dans la fenêtre : pas de carte', () => {
    const sparse = [run('old', addDays(TODAY, -300), 8, 330), run('x', addDays(TODAY, -20), 5, 330)];
    const a = run('now', TODAY, 12, 330, [330, 345, 320, 340, 325, 335, 328, 342, 322, 338, 330, 336]);
    expect(highlightOf(a, sparse)?.kind).not.toBe('longest');
  });

  it('c. retour après une coupure d’au moins 14 jours', () => {
    const past = [run('p', addDays(TODAY, -30), 8, 330), run('q', addDays(TODAY, -45), 8, 330)];
    const a = run('now', TODAY, 6, 330, [330, 340, 335, 345, 332, 338]);
    const h = highlightOf(a, past)!;
    expect(h.kind).toBe('return');
    expect(h.tone).toBe('accent');
    expect(h.value).toBe('30 jours');
    expect(highlightOf(a, [run('p', addDays(TODAY, -13), 8, 330)])?.kind).not.toBe('return');
  });

  it('d. kilomètre le plus rapide, en fin de sortie', () => {
    const a = run('now', TODAY, 9, 300, [313, 312, 286, 308, 313, 316, 290, 334, 220]);
    const h = highlightOf(a, history(4, 5))!;
    expect(h.kind).toBe('fastest_km');
    expect(h.tone).toBe('accent');
    expect(h.value).toBe('3:40 /km');
    expect(h.title).toMatch(/en fin de sortie/);
    expect(h.detail).toMatch(/Km 9/);
    expect(h.km).toBe(9);
  });

  it('d. km rapide au milieu : pas de mention « en fin de sortie » ; splits partiels de moins de 0,5 km ignorés', () => {
    const a: HighlightActivity = {
      ...run('now', TODAY, 6.1, 320),
      splits: [
        { km: 1, paceSec: 330 },
        { km: 2, paceSec: 300 },
        { km: 3, paceSec: 335 },
        { km: 4, paceSec: 340 },
        { km: 5, paceSec: 338 },
        { km: 6, paceSec: 332 },
        { km: 6.1, paceSec: 200 },
      ],
    };
    const h = highlightOf(a, history(4, 5))!;
    expect(h.kind).toBe('fastest_km');
    expect(h.value).toBe('5:00 /km');
    expect(h.title).not.toMatch(/fin de sortie/);
  });

  it('a. il faut battre le meilleur comparable d’au moins 1 % (bruit de mesure)', () => {
    const near = run('now', TODAY, 8, 299, ZIGZAG);
    const h = [...history(), run('best', addDays(TODAY, -20), 8, 300)];
    expect(highlightOf(near, h)?.kind).not.toBe('fastest_comparable');
  });

  it('e. negative split : 2e moitié plus rapide, sans km qui se détache', () => {
    const a = run('now', TODAY, 8, 320, [330, 329, 328, 327, 318, 317, 316, 315]);
    const h = highlightOf(a, history(4, 5))!;
    expect(h.kind).toBe('negative_split');
    expect(h.tone).toBe('accent');
    expect(h.value).toBe('−12 s/km');
  });

  it('f. régularité : coefficient de variation < 3 %', () => {
    const a = run('now', TODAY, 6, 300, [300, 301, 299, 300, 302, 298]);
    const h = highlightOf(a, history(4, 5))!;
    expect(h.kind).toBe('steady');
    expect(h.tone).toBe('accent');
    expect(h.value).toBe('±1 s/km');
  });

  it('un seul moment fort : l’ordre de priorité départage', () => {
    const a = run('now', TODAY, 12, 300, [300, 301, 299, 300, 302, 298, 300, 301, 299, 300, 302, 298]);
    // plus longue ET plus rapide sur la distance comparable → a (priorité 1) l’emporte sur b
    const longSteady = highlightOf(a, history(60, 8, 330));
    expect(longSteady?.kind).toBe('longest'); // distance 12 hors ±20 % de 8 : pas de comparable → b
  });

  it('aucun : pas de données, pas de carte', () => {
    expect(highlightOf({ id: 'x', type: 'run', date: TODAY, durationMin: 30 }, [])).toBeNull();
    expect(highlightOf({ id: 'x', type: 'strength', date: TODAY, durationMin: 45 }, history(3))).toBeNull();
  });

  it('texte débutant sans jargon', () => {
    const a = run('now', TODAY, 8, 300, ZIGZAG);
    const h = highlightOf(a, history(), { beginner: true })!;
    expect(h.title).toBe('Ta sortie la plus rapide');
    expect(h.detail).not.toMatch(/±|comparable/);
  });
});

const snapshotPath = path.join(__dirname, '../../../../fixtures/julien.snapshot.json');
const snapshot: { activities: (HighlightActivity & { startTime?: string })[] } | null = existsSync(snapshotPath)
  ? JSON.parse(readFileSync(snapshotPath, 'utf8'))
  : null;

(snapshot ? describe : describe.skip)('snapshot réel', () => {
  it('course du 15 octobre 2026 : km le plus rapide = km 9 à ≈ 3:40, en fin de sortie', () => {
    const acts = snapshot!.activities;
    const run15 = acts.find((a) => a.type === 'run' && a.date === '2026-10-15')!;
    const h = highlightOf(run15, acts)!;
    expect(h.kind).toBe('fastest_km');
    expect(h.title).toMatch(/en fin de sortie/);
    expect(h.detail).toMatch(/Km 9/);
    const pace = Number(h.value.split(':')[0]) * 60 + Number(h.value.split(':')[1].slice(0, 2));
    expect(Math.abs(pace - 220)).toBeLessThanOrEqual(5);
    expect(formatSecAsClock(pace)).toBe(h.value.replace(' /km', ''));
  });
});
