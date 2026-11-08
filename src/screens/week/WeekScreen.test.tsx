import { act, render, screen } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';
import type { WorkoutSession } from '@/src/core/types';
import { toISODate, weekDates } from '@/src/core/dates';
import { motion } from '@/src/design';

import { WeekScreen } from './WeekScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn(), back: jest.fn() },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('lucide-react-native', () => ({
  Check: () => null,
  ChevronRight: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/lib/proposalStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand');
  const store = create(() => ({
    proposals: [],
    loaded: true,
    load: jest.fn().mockResolvedValue(undefined),
  }));
  return { useProposalStore: store };
});

// ─── Utilitaires ────────────────────────────────────────────────────────────

function todayISO(): string {
  return toISODate(new Date());
}

function makeSession(over: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'ws-1',
    date: todayISO(),
    title: 'Footing 8 km',
    kind: 'run',
    subtitle: '',
    durationMin: 45,
    caloriesBurn: 350,
    completed: false,
    ...over,
  };
}

function seedReady(patch: Partial<ReturnType<typeof usePulseFitStore.getState>> = {}) {
  const { profile: profilePatch, ...rest } = patch;
  usePulseFitStore.setState((state) => ({
    dataReady: true,
    activities: [],
    sessions: [],
    confirmedRaceIds: [],
    rejectedRaceIds: [],
    raceNames: {},
    profile: { ...state.profile, level: 'regular' as const, ...profilePatch },
    ...rest,
  }));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  usePulseFitStore.setState({ dataReady: false });
});
afterEach(() => jest.useRealTimers());

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('WeekScreen', () => {
  it('squelettes visibles au chargement', async () => {
    usePulseFitStore.setState({ dataReady: false });
    await render(<WeekScreen />);
    await act(async () => void jest.advanceTimersByTime(motion.skeleton.delay + 50));
    expect(screen.getByTestId('week-loading')).toBeTruthy();
  });

  it('affiche le ScreenHeader avec titre et sous-titre', async () => {
    seedReady();
    await render(<WeekScreen />);
    expect(screen.getByTestId('screen-header')).toBeTruthy();
    expect(screen.getByText('Semaine')).toBeTruthy();
  });

  it('affiche 7 jours dans la WeekList', async () => {
    const dates = weekDates();
    const sessions = dates.map((date, i) =>
      makeSession({ id: `ws-${i}`, date, title: i === 0 ? 'Footing 8 km' : 'Repos', kind: i === 0 ? 'run' : 'rest' }),
    );
    seedReady({ sessions });
    await render(<WeekScreen />);
    expect(screen.getByTestId('week-list')).toBeTruthy();
    // 7 jours rendus
    const dayRows = dates.map((d) => screen.queryByTestId(`day-row-${d}`));
    expect(dayRows.filter(Boolean)).toHaveLength(7);
  });

  it('affiche la séance du jour avec "Aujourd’hui"', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<WeekScreen />);
    expect(screen.getByText('Aujourd’hui')).toBeTruthy();
    expect(screen.getByText('Footing 8 km')).toBeTruthy();
  });

  it('affiche la section "Avant" pour les semaines passées', async () => {
    seedReady();
    await render(<WeekScreen />);
    expect(screen.getByText('Avant')).toBeTruthy();
  });
});
