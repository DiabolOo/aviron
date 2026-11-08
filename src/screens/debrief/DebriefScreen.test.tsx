import { render, screen } from '@testing-library/react-native';

import { DebriefScreen } from './DebriefScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: (...args: unknown[]) => mockBack(...args) },
  useLocalSearchParams: () => ({ id: 'run1' }),
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('lucide-react-native', () => ({ ChevronLeft: () => null, Sparkles: () => null }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => <View {...props} />,
    G: (props: Record<string, unknown>) => <View {...props} />,
    Line: (props: Record<string, unknown>) => <View {...props} />,
    Circle: (props: Record<string, unknown>) => <View {...props} />,
    Path: (props: Record<string, unknown>) => <View {...props} />,
    Text: (props: Record<string, unknown>) => <View {...props} />,
  };
});

// Mock store
const mockStore: Record<string, unknown> = { activities: [], groupOverrides: [] };
jest.mock('@/lib/store', () => ({
  usePulseFitStore: (selector: (s: Record<string, unknown>) => unknown) => selector(mockStore),
}));

// Mock sportDerived
const mockDerived = {
  confirmedRaceMap: new Map<string, string>(),
  highlightFor: () => null,
  comparisonFor: () => null,
  raceDebrief: (() => undefined) as () => unknown,
  raceSummaryFor: () => undefined,
};

jest.mock('@/src/ui/useRaces', () => ({
  useSportDerived: () => mockDerived,
}));

jest.mock('@/src/ui/nav', () => ({
  perfLog: jest.fn(),
  openActivity: jest.fn(),
  openDebrief: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.activities = [];
  mockStore.groupOverrides = [];
  mockDerived.confirmedRaceMap = new Map();
  mockDerived.raceDebrief = () => undefined;
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('DebriefScreen', () => {
  it('course introuvable : EmptyState affiché', async () => {
    await render(<DebriefScreen />);
    expect(screen.getByText('Débrief introuvable')).toBeTruthy();
    expect(screen.getByTestId('back-header')).toBeTruthy();
  });

  it('course trouvée : affiche le titre et les numbered items', async () => {
    mockStore.activities = [{
      id: 'run1', name: 'Semi de Reims', type: 'run', date: '2026-10-11',
      startTime: '08:00', durationMin: 113, splits: [], hrStream: [], polyline: [],
      movingTimeSec: 6789, distanceKm: 21.88,
    }];
    mockStore.groupOverrides = [];
    mockDerived.confirmedRaceMap = new Map([['run1', 'race-run1']]);
    mockDerived.raceDebrief = () => ({
      race: {
        id: 'race-run1', activityId: 'run1', officialDistanceKm: 21.1,
        measuredDistanceKm: 21.88, date: '2026-10-11', status: 'completed',
        timeSec: 6789, name: 'Semi de Reims',
      },
      title: 'Semi de Reims',
      confirmed: true,
      timeSec: 6789,
      officialPaceSec: 322,
      averagePaceSec: 322,
      bands: [
        { label: 'T1', fromKm: 0, toKm: 7, officialPaceSec: 335, timeSec: 2345 },
        { label: 'T2', fromKm: 7, toKm: 14, officialPaceSec: 320, timeSec: 2240 },
        { label: 'T3', fromKm: 14, toKm: 21.1, officialPaceSec: 308, timeSec: 2204 },
      ],
      pacing: {
        title: 'Tu as fini plus vite',
        message: 'test',
        extras: ['33 s plus lent', 'Régulier', 'Le plus rapide'],
        summary: 'Pars à ton allure moyenne dès le départ.',
        why: 'Explication',
      },
      comparison: [],
    });

    await render(<DebriefScreen />);
    expect(screen.getByTestId('debrief-screen')).toBeTruthy();
    expect(screen.getByText('Ta course en trois temps')).toBeTruthy();
    expect(screen.getByTestId('back-header')).toBeTruthy();
    expect(screen.getByTestId('numbered-list')).toBeTruthy();
  });
});
