import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';
import type { WorkoutSession } from '@/src/core/types';
import { motion } from '@/src/design';

import TodayScreen from './index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('lucide-react-native', () => ({ Check: () => null }));
jest.mock('expo-linear-gradient', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    LinearGradient: (props: Record<string, unknown>) => <View {...props} />,
  };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeSession(over: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'ws-1',
    date: todayISO(),
    title: 'Footing 8 km',
    kind: 'run',
    subtitle: 'Environ 45 minutes, à une allure où tu peux parler.',
    durationMin: 45,
    caloriesBurn: 350,
    completed: false,
    ...over,
  };
}

function seedReady(patch: Partial<ReturnType<typeof usePulseFitStore.getState>> = {}) {
  usePulseFitStore.setState({
    dataReady: true,
    activities: [],
    sessions: [],
    confirmedRaceIds: [],
    rejectedRaceIds: [],
    raceNames: {},
    ...patch,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  usePulseFitStore.setState({ dataReady: false });
});
afterEach(() => jest.useRealTimers());

// ─── États ──────────────────────────────────────────────────────────────────

describe('TodayScreen — états', () => {
  it('chargement : squelettes visibles, pas de contenu', async () => {
    usePulseFitStore.setState({ dataReady: false });
    // Advance past skeleton delay
    await render(<TodayScreen />);
    await act(async () => void jest.advanceTimersByTime(motion.skeleton.delay + 50));
    expect(screen.getByTestId('today-loading')).toBeTruthy();
  });

  it('vide (aucune donnée) : EmptyState firstDay', async () => {
    seedReady();
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-firstDay')).toBeTruthy();
    expect(screen.getByText('Bienvenue dans PulseFit.')).toBeTruthy();
  });

  it('plan absent : EmptyState noPlan', async () => {
    seedReady({
      activities: [
        {
          id: 'a1',
          name: 'Footing',
          type: 'run',
          date: todayISO(),
          startTime: '08:00',
          durationMin: 30,
          splits: [],
          hrStream: [],
          polyline: [],
        },
      ],
    });
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-noPlan')).toBeTruthy();
    expect(screen.getByText('Pas encore de plan.')).toBeTruthy();
  });

  it('séance du jour : SessionCard affichée', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('session-card-planned')).toBeTruthy();
    expect(screen.getByText('Footing 8 km')).toBeTruthy();
    expect(screen.getByText('Reporter')).toBeTruthy();
  });

  it('séance validée : état done', async () => {
    seedReady({ sessions: [makeSession({ completed: true })] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('session-card-done')).toBeTruthy();
    expect(screen.getByText('Séance validée')).toBeTruthy();
  });

  it('jour de repos (plan sans séance aujourd\'hui) : EmptyState restWeek', async () => {
    seedReady({
      sessions: [makeSession({ date: '2099-01-01' })],
    });
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-restWeek')).toBeTruthy();
    expect(screen.getByText('Rien de prévu aujourd\u2019hui.')).toBeTruthy();
  });
});

// ─── En-tête ────────────────────────────────────────────────────────────────

describe('TodayScreen — en-tête', () => {
  it('salutation et prénom affichés', async () => {
    seedReady({ profile: { ...usePulseFitStore.getState().profile, firstName: 'Jul' } });
    await render(<TodayScreen />);
    // The greeting depends on the hour; just check the firstName is present
    const titleTexts = screen.getAllByText(/Jul/);
    expect(titleTexts.length).toBeGreaterThan(0);
  });

  it('avatar ouvre le profil', async () => {
    seedReady();
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByTestId('avatar-button'));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});

// ─── Validation ─────────────────────────────────────────────────────────────

describe('TodayScreen — validation', () => {
  it('valider → UndoToast « Séance validée »', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);

    // Hold to validate via accessibility action
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });

    // Session should now be done
    expect(usePulseFitStore.getState().sessions[0].completed).toBe(true);

    // UndoToast visible
    await act(async () => void jest.advanceTimersByTime(100));
    expect(screen.getByTestId('undo-toast')).toBeTruthy();
    // "Séance validée" appears both in SessionCard done and UndoToast
    expect(screen.getAllByText('Séance validée').length).toBeGreaterThanOrEqual(1);
  });

  it('annuler la validation restaure la séance', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);

    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(usePulseFitStore.getState().sessions[0].completed).toBe(true);

    await act(async () => void jest.advanceTimersByTime(100));
    await fireEvent.press(screen.getByText('Annuler'));
    expect(usePulseFitStore.getState().sessions[0].completed).toBe(false);
  });
});

// ─── Report ─────────────────────────────────────────────────────────────────

describe('TodayScreen — report', () => {
  it('reporter → feuille avec les choix', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);

    await fireEvent.press(screen.getByText('Reporter'));
    expect(screen.getByText('Reporter la séance')).toBeTruthy();
    expect(screen.getByText('Demain')).toBeTruthy();
    expect(screen.getByText('Après-demain')).toBeTruthy();
    expect(screen.getByText('Sauter cette séance')).toBeTruthy();
  });

  it('choisir demain déplace la séance', async () => {
    const today = todayISO();
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);

    await fireEvent.press(screen.getByText('Reporter'));
    await act(async () => {
      await fireEvent.press(screen.getByText('Demain'));
    });

    const movedSession = usePulseFitStore.getState().sessions[0];
    expect(movedSession.date).not.toBe(today);
  });

  it('demain désactivé si séance existante', async () => {
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    seedReady({
      sessions: [makeSession(), makeSession({ id: 'ws-2', date: tomorrow, title: 'Fractionné' })],
    });
    await render(<TodayScreen />);

    await fireEvent.press(screen.getByText('Reporter'));
    const demainButton = screen.getByTestId('postpone-demain');
    expect(demainButton.props.accessibilityState.disabled).toBe(true);
  });
});

// ─── Source ──────────────────────────────────────────────────────────────────

describe('TodayScreen — source', () => {
  it('pas de « 0 » affiché pour une donnée absente', async () => {
    seedReady({ sessions: [makeSession()] });
    const { toJSON } = await render(<TodayScreen />);
    const json = JSON.stringify(toJSON());
    // No standalone "0" values for missing data
    // (numbers can appear in text like "8 km" but not isolated "0")
    const textNodes = json.match(/"children":\["0"\]/g);
    expect(textNodes).toBeNull();
  });
});

// ─── Coach cards ────────────────────────────────────────────────────────────

describe('TodayScreen — coach cards', () => {
  it('source des insights est « Calculé sur ton téléphone »', async () => {
    // Create enough activities to trigger at least one insight
    const activities = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      name: `Footing ${i}`,
      type: 'run' as const,
      date: (() => {
        const d = new Date();
        d.setDate(d.getDate() - i * 3);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      startTime: '08:00',
      durationMin: 40 + i,
      distanceKm: 7 + i * 0.5,
      avgHr: 145 + i,
      splits: [],
      hrStream: [],
      polyline: [],
    }));

    seedReady({ activities, sessions: [makeSession()] });
    await render(<TodayScreen />);

    const sources = screen.queryAllByTestId('coach-source');
    for (const source of sources) {
      // All on-device insights must say "Calculé sur ton téléphone"
      expect(source.props.children).not.toBe('Rédigé par l\u2019IA');
    }
  });
});
