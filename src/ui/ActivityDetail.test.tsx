import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActivityDetail } from '@/components/sport/ActivityDetail';
import { paceCurveModel } from '@/src/core/paceCurve';
import type { StravaActivity } from '@/src/core/types';

jest.mock('lucide-react-native', () => ({
  __esModule: true,
  ...Object.fromEntries(['Flame', 'Sparkles', 'TriangleAlert', 'RotateCcw'].map((n) => [n, () => null])),
}));
jest.mock('@/src/ui/motion/useReducedMotion', () => ({ useReducedMotion: () => true }));

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

function textOf(): string {
  return JSON.stringify(screen.toJSON());
}

describe('Détail d’activité — course à pied (15 octobre 2026)', () => {
  it('moment fort en tête : km le plus rapide, en fin de sortie ; chiffres principaux affichés', async () => {
    await render(<ActivityDetail activity={RUN} history={[RUN]} maxHr={190} onOpenRace={noop} />);
    expect(screen.getByTestId('highlight-title').props.children).toBe('Ton kilomètre le plus rapide, en fin de sortie');
    expect(screen.getByTestId('highlight-value').props.children).toBe('3:40 /km');
    expect(screen.getByText('Km 9 : tu as accéléré en fin de sortie.')).toBeTruthy();
    expect(screen.getByText('9,1')).toBeTruthy();
    expect(screen.getByText('45:18')).toBeTruthy();
    expect(screen.getByText('49:13 au total')).toBeTruthy();
    expect(textOf()).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('courbe d’allure puis splits repliables', async () => {
    await render(<ActivityDetail activity={RUN} history={[RUN]} maxHr={190} onOpenRace={noop} />);
    expect(screen.getByTestId('pace-curve')).toBeTruthy();
    await fireEvent(screen.getByTestId('pace-curve'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 343, height: 190 } },
    });
    expect(screen.getByText(/pointillé : allure moyenne \d:\d{2} \/km/)).toBeTruthy();
    expect(textOf()).not.toMatch(/NaN|Infinity/);
    expect(screen.queryByText('Allure (min/km)')).toBeNull();
    await fireEvent.press(screen.getByText('Voir le détail des splits'));
    expect(screen.getByText('Allure (min/km)')).toBeTruthy();
    await fireEvent.press(screen.getByText('Masquer le détail des splits'));
    expect(screen.queryByText('Allure (min/km)')).toBeNull();
  });

  it('une seule carte moment fort', async () => {
    await render(<ActivityDetail activity={RUN} history={[RUN]} onOpenRace={noop} />);
    expect(screen.getAllByTestId('highlight-title')).toHaveLength(1);
  });

  it('course confirmée : durée chrono et bouton débrief', async () => {
    const onOpen = jest.fn();
    await render(<ActivityDetail activity={RUN} history={[RUN]} raceId="race-run" onOpenRace={onOpen} />);
    expect(screen.getByText('49:13')).toBeTruthy();
    await fireEvent.press(screen.getByText('Voir le débrief'));
    expect(onOpen).toHaveBeenCalledWith('race-run');
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
    await render(<ActivityDetail activity={bare} history={[]} onOpenRace={noop} />);
    expect(screen.queryByTestId('highlight-title')).toBeNull();
    expect(screen.queryByTestId('pace-curve')).toBeNull();
    expect(screen.queryByText('Voir le détail des splits')).toBeNull();
    expect(screen.getByTestId('hero-value')).toBeTruthy();
    expect(textOf()).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('moins de 3 splits complets : pas de courbe', async () => {
    const short: StravaActivity = {
      ...bare,
      distanceKm: 2.4,
      splits: [
        { km: 1, pace: '5:00', paceSec: 300, elevationGain: 1 },
        { km: 2, pace: '5:10', paceSec: 310, elevationGain: 1 },
        { km: 2.4, pace: '5:20', paceSec: 320, elevationGain: 0 },
      ],
    };
    await render(<ActivityDetail activity={short} history={[]} onOpenRace={noop} />);
    expect(screen.queryByTestId('pace-curve')).toBeNull();
    expect(textOf()).not.toMatch(/NaN|Infinity/);
  });

  it('allures toutes identiques : courbe sans NaN', async () => {
    const flat: StravaActivity = {
      ...bare,
      distanceKm: 5,
      splits: [1, 2, 3, 4, 5].map((km) => ({ km, pace: '5:00', paceSec: 300, elevationGain: 0 })),
    };
    await render(<ActivityDetail activity={flat} history={[]} onOpenRace={noop} />);
    await fireEvent(screen.getByTestId('pace-curve'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 343, height: 190 } },
    });
    expect(textOf()).not.toMatch(/NaN|Infinity/);
  });

  it('autres sports : pas de moment fort pour l’instant', async () => {
    const walk: StravaActivity = { ...RUN, id: 'walk', type: 'walk' };
    await render(<ActivityDetail activity={walk} history={[walk]} onOpenRace={noop} />);
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

  it('null sous 3 splits complets ou sans largeur', () => {
    expect(paceCurveModel([{ km: 1, paceSec: 300 }, { km: 2, paceSec: 310 }], 343, 190, pad)).toBeNull();
    expect(paceCurveModel(PACES.map((p, i) => ({ km: i + 1, paceSec: p })), 0, 190, pad)).toBeNull();
    expect(paceCurveModel(undefined, 343, 190, pad)).toBeNull();
  });
});
