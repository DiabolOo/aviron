import { render, screen } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';
import { addDaysISO, toISODate, startOfWeek } from '@/src/core/dates';

import { PastWeekScreen } from './PastWeekScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

function mockLastWeekStart(): string {
  const now = new Date();
  const start = startOfWeek(now);
  start.setDate(start.getDate() - 7);
  return toISODate(start);
}

const mockBack = jest.fn();
const mockStartParam = mockLastWeekStart();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: (...args: unknown[]) => mockBack(...args) },
  useLocalSearchParams: () => ({ start: mockStartParam }),
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('lucide-react-native', () => ({ ChevronLeft: () => null, Check: () => null, Sparkles: () => null }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function seedReady(patch: Partial<ReturnType<typeof usePulseFitStore.getState>> = {}) {
  usePulseFitStore.setState((state) => ({
    dataReady: true,
    activities: [],
    sessions: [],
    profile: { ...state.profile },
    ...patch,
  }));
}

beforeEach(() => jest.clearAllMocks());

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PastWeekScreen', () => {
  it('affiche le BackHeader "Cette semaine"', async () => {
    seedReady();
    await render(<PastWeekScreen />);
    expect(screen.getByTestId('back-header')).toBeTruthy();
  });

  it('affiche "Semaine passée" et la période', async () => {
    seedReady();
    await render(<PastWeekScreen />);
    expect(screen.getByText(/Semaine pass/)).toBeTruthy();
  });

  it('aucune activité : EmptyState affiché', async () => {
    seedReady();
    await render(<PastWeekScreen />);
    expect(screen.getByTestId('empty-noImport')).toBeTruthy();
  });

  it('activité présente : pas d’EmptyState', async () => {
    const date = addDaysISO(mockLastWeekStart(), 2);
    seedReady({
      activities: [{
        id: 'a1', name: 'Footing', type: 'run', date,
        startTime: '08:00', durationMin: 30, splits: [], hrStream: [], polyline: [],
      }],
    });
    await render(<PastWeekScreen />);
    expect(screen.queryByTestId('empty-noImport')).toBeNull();
  });

  it('affiche 7 DayDots', async () => {
    seedReady();
    await render(<PastWeekScreen />);
    // Les DayDots rendent des testIDs day-dot-*
    const dots = screen.getAllByTestId(/^day-dot-/);
    expect(dots).toHaveLength(7);
  });
});
