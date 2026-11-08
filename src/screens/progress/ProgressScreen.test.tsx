import { act, render, screen, fireEvent } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { motion } from '@/src/design';

import { ProgressScreen } from './ProgressScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('lucide-react-native', () => ({
  ChevronRight: () => null,
  Check: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock useRaceLists to return empty by default
const mockRaceLists = { confirmed: [] as unknown[], pending: [] as unknown[] };
jest.mock('@/src/ui/useRaces', () => ({
  useRaceLists: () => mockRaceLists,
  useSportDerived: () => ({
    confirmedRaceMap: new Map(),
    highlightFor: () => null,
    comparisonFor: () => null,
    raceDebrief: () => undefined,
    raceSummaryFor: () => undefined,
  }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  return toISODate(new Date());
}

function seedReady(patch: Partial<ReturnType<typeof usePulseFitStore.getState>> = {}) {
  usePulseFitStore.setState((state) => ({
    dataReady: true,
    activities: [],
    sessions: [],
    profile: { ...state.profile },
    ...patch,
  }));
}

function makeActivity(id: string, date: string, type: 'run' | 'swim' | 'ride' | 'walk' | 'strength' = 'run', durationMin = 45) {
  return {
    id, name: `Activity ${id}`, type, date,
    startTime: '08:00', durationMin, splits: [], hrStream: [], polyline: [],
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  usePulseFitStore.setState({ dataReady: false });
  mockRaceLists.confirmed = [];
  mockRaceLists.pending = [];
});
afterEach(() => jest.useRealTimers());

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ProgressScreen', () => {
  it('squelette au chargement', async () => {
    usePulseFitStore.setState({ dataReady: false });
    await render(<ProgressScreen />);
    await act(async () => void jest.advanceTimersByTime(motion.skeleton.delay + 50));
    expect(screen.getByTestId('progress-loading')).toBeTruthy();
  });

  it('affiche ScreenHeader avec titre et sous-titre', async () => {
    seedReady();
    await render(<ProgressScreen />);
    expect(screen.getByTestId('screen-header')).toBeTruthy();
    expect(screen.getByText('Progrès')).toBeTruthy();
  });

  it('affiche le SegmentedControl avec 3 options', async () => {
    seedReady();
    await render(<ProgressScreen />);
    expect(screen.getByText('Semaine')).toBeTruthy();
    expect(screen.getByText('Mois')).toBeTruthy();
    expect(screen.getByText('Année')).toBeTruthy();
  });

  it('état vide : EmptyState firstSessions affiché', async () => {
    seedReady();
    await render(<ProgressScreen />);
    expect(screen.getByTestId('empty-firstSessions')).toBeTruthy();
    expect(screen.getByText(/Ta progression arrive/)).toBeTruthy();
  });

  it('avec activités : affiche HeroMetric et WeekBars', async () => {
    const today = todayISO();
    seedReady({
      activities: [
        makeActivity('a1', today, 'run', 60),
        makeActivity('a2', today, 'run', 30),
        makeActivity('a3', today, 'swim', 45),
        makeActivity('a4', today, 'run', 50),
        makeActivity('a5', today, 'run', 40),
        makeActivity('a6', today, 'run', 35),
      ],
    });
    await render(<ProgressScreen />);
    expect(screen.queryByTestId('empty-firstSessions')).toBeNull();
    expect(screen.getByTestId('hero-metric')).toBeTruthy();
    expect(screen.getByTestId('week-bars')).toBeTruthy();
  });

  it('navigation de période avec ‹ et ›', async () => {
    const today = todayISO();
    seedReady({
      activities: [
        makeActivity('a1', today, 'run', 60),
        makeActivity('a2', today, 'run', 30),
        makeActivity('a3', today, 'run', 45),
        makeActivity('a4', today, 'run', 50),
        makeActivity('a5', today, 'run', 40),
        makeActivity('a6', today, 'run', 35),
      ],
    });
    await render(<ProgressScreen />);
    const prev = screen.getByTestId('period-prev');
    expect(prev).toBeTruthy();
    fireEvent.press(prev);
    // After navigating back, period label should update
    expect(screen.getByTestId('period-label')).toBeTruthy();
  });

  it('courses confirmées : RaceList affiché', async () => {
    const today = todayISO();
    seedReady({
      activities: Array.from({ length: 6 }, (_, i) =>
        makeActivity(`a${i}`, today, 'run', 60),
      ),
    });
    mockRaceLists.confirmed = [{
      id: 'r1',
      name: 'Semi de Reims',
      date: '2026-10-11',
      activityId: 'a1',
      officialDistanceKm: 21.1,
      timeSec: 6789,
      status: 'completed',
      confidence: 'high',
      reasons: [],
    }];
    await render(<ProgressScreen />);
    expect(screen.getByTestId('race-list')).toBeTruthy();
  });
});
