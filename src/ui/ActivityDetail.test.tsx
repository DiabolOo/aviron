import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActivityDetail } from '@/components/sport/ActivityDetail';
import { axisKmLabel, monotonePath, paceCurveModel, tooltipLabel } from '@/src/core/paceCurve';
import { formatClock } from '@/src/core/sportFormat';
import type { Highlight } from '@/src/core/training/highlights';
import type { RaceSummary } from '@/src/core/training/raceView';
import { AnimatedNumber } from '@/src/ui/motion/AnimatedNumber';
import type { StravaActivity } from '@/src/core/types';

jest.mock('lucide-react-native', () => ({
  __esModule: true,
  ...Object.fromEntries(['Flame', 'Sparkles', 'TriangleAlert', 'RotateCcw'].map((n) => [n, () => null])),
}));
jest.mock('@/src/ui/motion/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/src/ui/motion/useAfterInteractions', () => ({ useAfterInteractions: () => true }));

const PACES = [313, 312, 286, 308, 313, 316, 290, 334, 220];

const RUN: StravaActivity = {
  id: 'run',
  name: 'Course à pied matinale',
  type: 'run',
  date: '2026-10-15',
  startTime: '10:14:34',
  distanceKm: 9.111,
  durationMin: 49.2167,
  movingTimeSec: 2718,
  elevationM: 42,
  calories: 640,
  avgHr: 158,
  maxHr: 176,
  hrStream: [],
  polyline: [],
  splits: PACES.map((p, i) => ({ km: i + 1, pace: `${Math.floor(p / 60)}:${`${p % 60}`.padStart(2, '0')}`, paceSec: p, elevationGain: 3, avgHr: 150 + i })),
};

const noop = () => undefined;

/** Moment fort « km le plus rapide » tel que produit par highlightOfIndexed sur les données du test. */
const FASTEST_KM: Highlight = {
  kind: 'fastest_km',
  tone: 'accent',
  title: 'Ton kilomètre le plus rapide, en fin de sortie',
  value: '3:40 /km',
  detail: 'Km 9 : tu as accéléré en fin de sortie.',
  km: 9,
};

const LONGEST: Highlight = {
  kind: 'longest',
  tone: 'flame',
  title: 'Ta plus longue sortie',
  value: '12,0 km',
  detail: 'Plus longue que toutes tes sorties de ces 12 dernières semaines.',
};

function textOf(): string {
  return JSON.stringify(screen.toJSON());
}

describe('Détail d’activité — course à pied (15 octobre 2026)', () => {
  it('moment fort sur une ligne sous les chiffres clés, sans carte', async () => {
    await render(<ActivityDetail activity={RUN} highlight={FASTEST_KM} onOpenRace={noop} />);
    expect(screen.getByText(/Ton kilomètre le plus rapide, en fin de sortie · 3:40 \/km/)).toBeTruthy();
    expect(screen.getAllByTestId('highlight-title')).toHaveLength(1);
    expect(screen.queryByText(/Km 9 : tu as accéléré/)).toBeNull();
    expect(screen.getByText('9,1')).toBeTruthy();
    expect(screen.getByText('45:18')).toBeTruthy();
    expect(screen.getByText('49:13 au total')).toBeTruthy();
    expect(screen.getByText('4:58')).toBeTruthy();
    expect(textOf()).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('titre limité à 2 lignes', async () => {
    await render(<ActivityDetail activity={{ ...RUN, name: 'Semi Reims (on a ramené la coupe de champagne à la maison)' }} highlight={null} onOpenRace={noop} />);
    expect(screen.getByText(/Semi Reims/).props.numberOfLines).toBe(2);
  });

  it('une valeur déjà affichée n’est pas répétée par le moment fort', async () => {
    const long: StravaActivity = { ...RUN, distanceKm: 12.04, splits: [] };
    await render(<ActivityDetail activity={long} highlight={LONGEST} onOpenRace={noop} />);
    expect(screen.getByText(/Ta plus longue sortie/)).toBeTruthy();
    expect(screen.queryByTestId('highlight-value')).toBeNull();
  });

  it('courbe d’allure : un seul point (le km du moment fort), moyenne libellée, « ↑ plus rapide », splits repliés en lien discret', async () => {
    await render(<ActivityDetail activity={RUN} highlight={FASTEST_KM} onOpenRace={noop} />);
    expect(screen.getByText('↑ plus rapide')).toBeTruthy();
    expect(screen.queryByText(/pointillé/)).toBeNull();
    await fireEvent(screen.getByTestId('pace-curve'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 343, height: 190 } },
    });
    expect(screen.getAllByTestId('pace-curve-point')).toHaveLength(1);
    expect(textOf()).toContain('moy. 4:58');
    expect(textOf()).not.toMatch(/NaN|Infinity/);
    expect(screen.queryByText('Allure (min/km)')).toBeNull();
    await fireEvent.press(screen.getByText('Voir le détail des splits'));
    expect(screen.getByText('Allure (min/km)')).toBeTruthy();
    await fireEvent.press(screen.getByText('Masquer le détail des splits'));
    expect(screen.queryByText('Allure (min/km)')).toBeNull();
  });
});

describe('Détail d’activité — course confirmée (semi du 11 octobre 2026)', () => {
  const SEMI: StravaActivity = { ...RUN, id: 'semi', name: 'Semi Reims', date: '2026-10-11', distanceKm: 21.876, durationMin: 113.15, movingTimeSec: 6785 };
  const race: RaceSummary = {
    raceId: 'race-semi',
    timeSec: 6789,
    officialPaceSec: 322,
    officialKm: 21.0975,
    measuredKm: 21.876,
    highlight: {
      kind: 'race_vs_last_year',
      tone: 'accent',
      title: 'Par rapport à l’an dernier (1h50:50)',
      value: '+2 min',
      detail: '',
    },
  };

  it('héros = chrono, allure officielle, distance « 21,1 km · 21,9 GPS », lien débrief dans le résumé', async () => {
    const onOpen = jest.fn();
    await render(<ActivityDetail activity={SEMI} highlight={null} race={race} onOpenRace={onOpen} />);
    expect(screen.getByTestId('hero-value').props.children.props.value).toBe(6789);
    expect(screen.getByText('1h53:09')).toBeTruthy();
    expect(screen.getByTestId('race-distance').props.children).toBe('21,1 km · 21,9 GPS');
    expect(screen.getByText('5:22')).toBeTruthy();
    expect(screen.queryByText('Durée')).toBeNull();
    expect(screen.getAllByText('Voir le débrief')).toHaveLength(1);
    await fireEvent.press(screen.getByText('Voir le débrief'));
    expect(onOpen).toHaveBeenCalledWith('race-semi');
  });

  it('moment fort orienté course', async () => {
    await render(<ActivityDetail activity={SEMI} highlight={null} race={race} onOpenRace={noop} />);
    expect(screen.getByText(/Par rapport à l’an dernier \(1h50:50\) · \+2 min/)).toBeTruthy();
  });
});

describe('AnimatedNumber', () => {
  it('respecte le format : « 45:18 », « 9,1 »', async () => {
    await render(<AnimatedNumber value={2718} format={formatClock} testID="n" />);
    expect(screen.getByTestId('n').props.children).toBe('45:18');
  });
});

describe('Détail d’activité — pire cas', () => {
  const bare: StravaActivity = {
    id: 'bare',
    name: 'Sortie',
    type: 'run',
    date: '2026-10-15',
    startTime: '08:00:00',
    durationMin: 30,
    hrStream: [],
    polyline: [],
    splits: [],
  };

  it('sans distance, ni splits, ni carte, ni courbe : aucune carte, aucun NaN', async () => {
    await render(<ActivityDetail activity={bare} highlight={null} onOpenRace={noop} />);
    expect(screen.queryByTestId('highlight-title')).toBeNull();
    expect(screen.queryByTestId('pace-curve')).toBeNull();
    expect(screen.queryByText('Voir le détail des splits')).toBeNull();
    expect(screen.getByTestId('hero-value')).toBeTruthy();
    expect(textOf()).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('moins de 3 splits : pas de courbe', async () => {
    const short: StravaActivity = {
      ...bare,
      distanceKm: 2.4,
      splits: [
        { km: 1, pace: '5:00', paceSec: 300, elevationGain: 1 },
        { km: 2.4, pace: '5:20', paceSec: 320, elevationGain: 0 },
      ],
    };
    await render(<ActivityDetail activity={short} highlight={null} onOpenRace={noop} />);
    expect(screen.queryByTestId('pace-curve')).toBeNull();
    expect(textOf()).not.toMatch(/NaN|Infinity/);
  });

  it('allures toutes identiques : courbe sans NaN', async () => {
    const flat: StravaActivity = {
      ...bare,
      distanceKm: 5,
      splits: [1, 2, 3, 4, 5].map((km) => ({ km, pace: '5:00', paceSec: 300, elevationGain: 0 })),
    };
    await render(<ActivityDetail activity={flat} highlight={null} onOpenRace={noop} />);
    await fireEvent(screen.getByTestId('pace-curve'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 343, height: 190 } },
    });
    expect(textOf()).not.toMatch(/NaN|Infinity/);
  });

  it('autres sports : pas de moment fort pour l’instant', async () => {
    const walk: StravaActivity = { ...RUN, id: 'walk', type: 'walk' };
    await render(<ActivityDetail activity={walk} highlight={FASTEST_KM} onOpenRace={noop} />);
    expect(screen.queryByTestId('highlight-title')).toBeNull();
    expect(screen.queryByTestId('pace-curve')).toBeNull();
  });
});

describe('paceCurveModel', () => {
  const pad = { left: 46, right: 14, top: 14, bottom: 26 };

  it('axe inversé : l’allure la plus rapide est la plus haute', () => {
    const m = paceCurveModel(PACES.map((p, i) => ({ km: i + 1, paceSec: p })), 343, 190, pad)!;
    const fastest = m.points.reduce((a, b) => (b.paceSec < a.paceSec ? b : a));
    expect(Math.min(...m.points.map((p) => p.y))).toBe(fastest.y);
    expect(m.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(m.avgY).toBeGreaterThan(Math.min(...m.points.map((p) => p.y)));
  });

  it('inclut les splits partiels (sauf bruit sous 50 m) et prend la moyenne fournie', () => {
    const splits = [1, 2, 3, 4].map((km) => ({ km, paceSec: 300 + km }));
    const m = paceCurveModel([...splits, { km: 4.3, paceSec: 200 }], 343, 190, pad, 305)!;
    expect(m.points.map((p) => p.km)).toEqual([1, 2, 3, 4, 4.3]);
    expect(m.avgPaceSec).toBe(305);
    expect(paceCurveModel([...splits, { km: 4.02, paceSec: 200 }], 343, 190, pad)!.points).toHaveLength(4);
  });

  it('moins de 5 points : barres ; 5 points ou plus : courbe', () => {
    const four = [1, 2, 3, 4].map((km) => ({ km, paceSec: 300 + km }));
    expect(paceCurveModel(four, 343, 190, pad)!.mode).toBe('bars');
    expect(paceCurveModel([...four, { km: 5, paceSec: 300 }], 343, 190, pad)!.mode).toBe('curve');
  });

  it('2 ou 3 graduations à des valeurs rondes', () => {
    const m = paceCurveModel(PACES.map((p, i) => ({ km: i + 1, paceSec: p })), 343, 190, pad)!;
    expect(m.ticks.length).toBeGreaterThanOrEqual(2);
    expect(m.ticks.length).toBeLessThanOrEqual(3);
    expect(m.ticks.every((t) => t.paceSec % 5 === 0)).toBe(true);
  });

  it('interpolation monotone : jamais au-delà des points réels', () => {
    const pts = [0, 1, 2, 3, 4, 5].map((i) => ({ x: i * 50, y: [100, 40, 40, 90, 20, 60][i] }));
    const d = monotonePath(pts);
    const ys = [...d.matchAll(/C([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/g)].flatMap((m) => [Number(m[2]), Number(m[4])]);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
  });

  it('libellés français : « km 21,9 », « arrivée », info-bulle avec FC', () => {
    expect(axisKmLabel(21.9)).toBe('km 21,9');
    expect(axisKmLabel(9)).toBe('km 9');
    expect(axisKmLabel(21.9, true)).toBe('arrivée');
    expect(tooltipLabel({ km: 14, paceSec: 312 })).toBe('Km 14 · 5:12 /km');
    expect(tooltipLabel({ km: 14, paceSec: 312, avgHr: 152 })).toBe('Km 14 · 5:12 /km · 152 bpm');
  });

  it('null sous 3 splits complets ou sans largeur', () => {
    expect(paceCurveModel([{ km: 1, paceSec: 300 }, { km: 2, paceSec: 310 }], 343, 190, pad)).toBeNull();
    expect(paceCurveModel(PACES.map((p, i) => ({ km: i + 1, paceSec: p })), 0, 190, pad)).toBeNull();
    expect(paceCurveModel(undefined, 343, 190, pad)).toBeNull();
  });
});
