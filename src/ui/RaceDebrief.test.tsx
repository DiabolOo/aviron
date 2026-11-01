import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ConfirmRaceCard } from '@/components/race/ConfirmRaceCard';
import { RaceDebriefBody } from '@/components/race/RaceDebriefBody';
import { RaceInsightCards } from '@/components/race/RaceInsightCards';
import { RacesSection } from '@/components/race/RacesSection';
import { TargetRace } from '@/components/race/TargetRace';
import { ActivityRow } from '@/components/sport/ActivityRow';
import { usePulseFitStore } from '@/lib/store';
import type { StravaActivity } from '@/src/core/types';
import { resetNavLock } from '@/src/ui/nav';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), back: () => mockBack() },
}));
jest.mock('lucide-react-native', () => ({ __esModule: true, ...Object.fromEntries(['TriangleAlert', 'RotateCcw', 'Activity', 'Bike', 'Dumbbell', 'Footprints', 'Mountain', 'Waves', 'ChevronRight', 'ChevronDown', 'BarChart3', 'Sparkles'].map((n) => [n, () => null])) }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function semi(id: string, date: string, durationMin: number, distanceKm: number, withHr: boolean): StravaActivity {
  return {
    id,
    name: 'Semi Reims',
    type: 'run',
    date,
    startTime: '09:00',
    distanceKm,
    durationMin,
    avgHr: withHr ? 172 : undefined,
    hrStream: [],
    polyline: [],
    splits: Array.from({ length: 22 }, (_, i) => ({
      km: Math.min(i + 1, distanceKm),
      pace: '5:15',
      paceSec: i < 11 ? 300 : 330,
      elevationGain: 2,
      avgHr: withHr ? (i < 11 ? 165 : 179) : undefined,
    })),
  };
}

const ACTIVITIES = [
  semi('a24', '2024-03-03', 108.2667, 21.671, false),
  semi('a25', '2025-10-12', 110.8333, 21.336, true),
  semi('a26', '2026-10-11', 113.15, 21.876, false),
];

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  resetNavLock();
  usePulseFitStore.setState({
    activities: ACTIVITIES,
    confirmedRaceIds: ['a24', 'a25', 'a26'],
    rejectedRaceIds: [],
    raceNames: {},
  });
});

describe('Débrief de course', () => {
  it('course avec FC (Reims 2025) : temps, allure, tranches sur une ligne, moitiés et phrase de dérive', async () => {
    await render(<RaceDebriefBody id="race-a25" />);
    expect(screen.getByTestId('race-time').props.children).toBe('1h50:50');
    expect(screen.getByTestId('race-pace').props.children.join('')).toBe('5:15\u00a0/km');
    expect(screen.getByText('Tranches')).toBeTruthy();
    expect(screen.getByText('Km 0 → 5,3')).toBeTruthy();
    expect(screen.getAllByText(/\d{3}\sbpm/).length).toBeGreaterThan(0);
    expect(screen.getByText('Moitiés')).toBeTruthy();
    expect(screen.queryByText('Dérive cardiaque')).toBeNull();
    expect(screen.getByText(/Ta FC a grimpé de 13\sbpm en 2e moitié/)).toBeTruthy();
    expect(screen.getAllByTestId('average-pace-line')).toHaveLength(4);
  });

  it('course sans FC (Reims 2026) : note de distance sur une ligne + (i), pas de moitiés ni de phrase de dérive', async () => {
    await render(<RaceDebriefBody id="race-a26" />);
    expect(screen.getByTestId('race-time').props.children).toBe('1h53:09');
    const note = screen.getByText(/\+3,7\s%/);
    expect(note.props.numberOfLines).toBe(1);
    expect(screen.queryByText(/trajectoire et de la précision du GPS/)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Détail de la distance'));
    expect(screen.getByText(/trajectoire et de la précision du GPS/)).toBeTruthy();
    expect(screen.getByText('Tranches')).toBeTruthy();
    expect(screen.queryByText('Moitiés')).toBeNull();
    expect(screen.queryByText(/Ta FC/)).toBeNull();
    expect(screen.queryByText('–')).toBeNull();
    expect(screen.queryByText('—')).toBeNull();
  });

  it('conseil d’allure : titre + une phrase avec le chiffre clé, « Pourquoi ? » fermé par défaut, provenance « données »', async () => {
    await render(<RaceDebriefBody id="race-a25" />);
    expect(screen.getByTestId('advice-card-data')).toBeTruthy();
    expect(screen.getByTestId('advice-source').props.children).toBe('D’après tes données');
    expect(screen.getByText('Ton départ était un peu trop rapide')).toBeTruthy();
    const summary = screen.getByTestId('advice-summary');
    expect(summary.props.children).toMatch(/Ta 2e moitié est 9,9\u00a0% plus lente que la 1re\./);
    expect(StyleSheet.flatten(summary.props.style).lineHeight).toBeCloseTo(15 * 1.45, 1);
    expect(screen.queryByTestId('advice-why')).toBeNull();
    await fireEvent.press(screen.getByText('Pourquoi ?'));
    expect(screen.getByTestId('advice-why')).toBeTruthy();
    expect(screen.getByText(/Vise 5:15\s\/km dès le départ/)).toBeTruthy();
    expect(screen.getByText(/Un départ trop rapide se paie/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Pourquoi ?'));
    expect(screen.queryByTestId('advice-why')).toBeNull();
  });

  it('« Tes semi-marathons » : course affichée en évidence, badge meilleure, navigation', async () => {
    await render(<RaceDebriefBody id="race-a26" />);
    expect(screen.getByText('Tes semi-marathons')).toBeTruthy();
    expect(screen.queryByText('Courses précédentes')).toBeNull();
    expect(screen.getAllByTestId('race-row-current')).toHaveLength(1);
    expect(screen.getAllByText('Meilleure')).toHaveLength(1);
    await fireEvent.press(screen.getAllByText('1h50:50')[0]);
    expect(mockPush).toHaveBeenCalledWith('/race/race-a25');
  });

  it('le nom choisi à la confirmation sert de titre unique (2 lignes max) ; titre d’origine en bas, sans troncature', async () => {
    usePulseFitStore.setState({ raceNames: { a25: 'Semi-marathon du 12 octobre 2025' } });
    await render(<RaceDebriefBody id="race-a25" />);
    expect(screen.getAllByText('Semi-marathon du 12 octobre 2025')).toHaveLength(1);
    expect(screen.getByTestId('race-title').props.numberOfLines).toBe(2);
    expect(screen.queryByTestId('race-original-name')).toBeNull();
    const original = screen.getByTestId('original-title');
    expect(original).toBeTruthy();
    expect(screen.getByText('Titre d’origine')).toBeTruthy();
    expect(screen.getByText('Semi Reims').props.numberOfLines).toBeUndefined();
  });

  it('sans nom choisi : suggestion avec la ville, date puis chrono sous le titre', async () => {
    await render(<RaceDebriefBody id="race-a25" />);
    expect(screen.getByTestId('race-title').props.children).toMatch(/^Semi-marathon /);
    expect(screen.getByText('12 octobre 2025')).toBeTruthy();
    expect(screen.getByTestId('race-time')).toBeTruthy();
  });

  it('course introuvable : écran d’erreur avec retour', async () => {
    await render(<RaceDebriefBody id="race-inconnue" />);
    expect(screen.getByText('Course introuvable')).toBeTruthy();
    await fireEvent.press(screen.getByText('Retour'));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('Accueil : carte course', () => {
  const setToday = (iso: string) =>
    jest.useFakeTimers({
      now: new Date(`${iso}T12:00:00`),
      doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
  const withGoal = (targetValue: string | undefined) =>
    usePulseFitStore.setState({
      profile: {
        ...usePulseFitStore.getState().profile,
        athleticGoal: targetValue
          ? { type: 'race_prep', targetName: 'Semi-marathon', targetValue, targetDate: '2027-03-14', weeklySessionsCount: 4 }
          : undefined,
      },
    });

  beforeEach(() => withGoal(undefined));
  afterEach(() => jest.useRealTimers());

  it('nom, chrono et une ligne (gain estimé sans objectif) ; toute la carte ouvre le débrief, sans lien texte', async () => {
    setToday('2026-10-14');
    withGoal(undefined);
    await render(<RaceInsightCards />);
    expect(screen.getByTestId('race-card-time').props.children).toBe('1h53:09');
    expect(screen.getByText(/Semi-marathon/)).toBeTruthy();
    expect(screen.getByTestId('race-card-line').props.children).toMatch(/^Jusqu’à environ \d+\u00a0min à gagner/);
    expect(screen.queryByText('Voir le débrief')).toBeNull();
    await fireEvent.press(screen.getByTestId('race-card-time'));
    expect(mockPush).toHaveBeenCalledWith('/race/race-a26');
  });

  it('avec un objectif de même distance : écart à l’objectif', async () => {
    setToday('2026-10-14');
    withGoal('1h45');
    await render(<RaceInsightCards />);
    expect(screen.getByTestId('race-card-line').props.children).toBe('+8\u00a0min par rapport à ton objectif (1h45)');
  });

  it('visible le 7e jour', async () => {
    setToday('2026-10-18');
    await render(<RaceInsightCards />);
    expect(screen.getByTestId('race-card')).toBeTruthy();
  });

  it('masquée le 8e jour', async () => {
    setToday('2026-10-19');
    await render(<RaceInsightCards />);
    expect(screen.queryByTestId('race-card')).toBeNull();
  });
});

describe('Confirmation d’une course', () => {
  it('Oui propose un nom pré-rempli, Valider confirme et enregistre le nom', async () => {
    usePulseFitStore.setState({ confirmedRaceIds: [] });
    await render(
      <ConfirmRaceCard
        raceId="race-a25"
        title="C’était une course ?"
        message="12 oct. 2025"
        suggestedName="Semi-marathon du 12 octobre 2025"
      />,
    );
    await fireEvent.press(screen.getByText('Oui'));
    expect(screen.getByDisplayValue('Semi-marathon du 12 octobre 2025')).toBeTruthy();
    expect(screen.getByTestId('original-title-ref')).toHaveTextContent('Titre d’origine : Semi Reims');
    await fireEvent.changeText(screen.getByLabelText('Nom de la course'), 'Reims 2025');
    await fireEvent.press(screen.getByText('Valider'));
    expect(usePulseFitStore.getState().confirmedRaceIds).toEqual(['a25']);
    expect(usePulseFitStore.getState().raceNames).toEqual({ a25: 'Reims 2025' });
  });

  it('Non écarte la course', async () => {
    usePulseFitStore.setState({ confirmedRaceIds: [] });
    await render(<ConfirmRaceCard raceId="race-a25" title="t" message="m" suggestedName="n" />);
    await fireEvent.press(screen.getByText('Non'));
    expect(usePulseFitStore.getState().rejectedRaceIds).toEqual(['a25']);
  });
});

describe('Journal : durée et badge Course', () => {
  const activity: StravaActivity = {
    ...ACTIVITIES[2],
    id: 'run',
    name: 'Course à pied du midi',
    date: '2026-10-15',
    durationMin: 49.2167,
    movingTimeSec: 2718,
    distanceKm: 9.111,
    splits: [],
  };

  it('durée de déplacement en principal', async () => {
    await render(<ActivityRow activity={activity} first />);
    expect(screen.getByText(/45:18/)).toBeTruthy();
    expect(screen.queryByText('Course')).toBeNull();
  });

  it('course : temps écoulé (chrono), badge qui ouvre le débrief', async () => {
    await render(<ActivityRow activity={activity} first raceId="race-run" />);
    expect(screen.getByText(/49:13/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Course'));
    expect(mockPush).toHaveBeenCalledWith('/race/race-run');
  });
});

describe('Suivi › Sport › Courses', () => {
  it('masquée sans course confirmée ni candidate à confirmer', async () => {
    usePulseFitStore.setState({ confirmedRaceIds: [], rejectedRaceIds: ['a24', 'a25', 'a26'] });
    await render(<RacesSection />);
    expect(screen.queryByText('Courses')).toBeNull();
  });

  it('« À confirmer » (candidates de plus de 28 jours) puis « Courses passées » ; une ligne ouvre le débrief', async () => {
    usePulseFitStore.setState({ confirmedRaceIds: ['a25'] });
    await render(<RacesSection />);
    expect(screen.getByText('Courses')).toBeTruthy();
    expect(screen.getByText('À confirmer')).toBeTruthy();
    expect(screen.getByText('Courses passées')).toBeTruthy();
    expect(screen.getAllByText('C’était une course ?').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText('1h50:50'));
    expect(mockPush).toHaveBeenCalledWith('/race/race-a25');
  });

  it('candidates seules : « À confirmer » sans « Courses passées »', async () => {
    usePulseFitStore.setState({ confirmedRaceIds: [] });
    await render(<RacesSection />);
    expect(screen.getByText('À confirmer')).toBeTruthy();
    expect(screen.queryByText('Courses passées')).toBeNull();
  });
});

describe('Suivi › Objectifs', () => {
  it('affiche seulement la course visée', async () => {
    usePulseFitStore.setState({
      profile: {
        ...usePulseFitStore.getState().profile,
        athleticGoal: { type: 'race_prep', targetName: 'Semi-marathon', targetValue: '1h45', targetDate: '2027-03-14', weeklySessionsCount: 4 },
      },
    });
    await render(<TargetRace />);
    expect(screen.getByText('Course visée')).toBeTruthy();
    expect(screen.getByText('Semi-marathon')).toBeTruthy();
    expect(screen.queryByText('Courses passées')).toBeNull();
  });
});
