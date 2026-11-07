import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import type { WorkoutSession } from '@/src/core/types';
import { motion } from '@/src/design';

import { TodayScreen } from './TodayScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), navigate: jest.fn() },
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
  const { View: RNView } = require('react-native');
  return { LinearGradient: (props: Record<string, unknown>) => <RNView {...props} /> };
});
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Proposal store : charge immédiatement avec 0 propositions par défaut
jest.mock('@/lib/proposalStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand');
  const store = create(() => ({
    proposals: [],
    loaded: true,
    lastResolved: null,
    load: jest.fn().mockResolvedValue(undefined),
    accept: jest.fn().mockResolvedValue(undefined),
    reject: jest.fn().mockResolvedValue(undefined),
    undo: jest.fn().mockResolvedValue(undefined),
    dismissToast: jest.fn(),
  }));
  return { useProposalStore: store };
});

// ─── Utilitaires ────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function makeSession(over: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: 'ws-1',
    date: todayISO(),
    title: 'Footing 8 km',
    kind: 'run',
    subtitle: 'Environ 45 minutes, \u00e0 une allure o\u00f9 tu peux parler.',
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
    // Reset unavailableDates to avoid leakage between tests; caller can override via profile:
    profile: { ...state.profile, unavailableDates: undefined, ...profilePatch },
    ...rest,
  }));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  usePulseFitStore.setState({ dataReady: false });
});
afterEach(() => jest.useRealTimers());

// ─── 1. États ────────────────────────────────────────────────────────────────

describe('TodayScreen \u2014 \u00e9tats', () => {
  it('chargement : squelettes visibles', async () => {
    usePulseFitStore.setState({ dataReady: false });
    await render(<TodayScreen />);
    await act(async () => void jest.advanceTimersByTime(motion.skeleton.delay + 50));
    expect(screen.getByTestId('today-loading')).toBeTruthy();
  });

  it('vide (aucune donn\u00e9e) : EmptyState firstDay', async () => {
    seedReady();
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-firstDay')).toBeTruthy();
  });

  it('plan absent : EmptyState noPlan', async () => {
    seedReady({
      activities: [
        {
          id: 'a1', name: 'Footing', type: 'run', date: todayISO(),
          startTime: '08:00', durationMin: 30, splits: [], hrStream: [], polyline: [],
        },
      ],
    });
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-noPlan')).toBeTruthy();
  });

  it('s\u00e9ance du jour : SessionCard affich\u00e9e', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('session-card-planned')).toBeTruthy();
    expect(screen.getByText('Footing 8 km')).toBeTruthy();
    expect(screen.getByText('Reporter')).toBeTruthy();
  });

  it('s\u00e9ance valid\u00e9e : \u00e9tat done', async () => {
    seedReady({ sessions: [makeSession({ completed: true })] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('session-card-done')).toBeTruthy();
    expect(screen.getByText('S\u00e9ance valid\u00e9e')).toBeTruthy();
  });

  it('jour de repos (plan sans s\u00e9ance aujourd\u2019hui) : EmptyState restWeek', async () => {
    seedReady({ sessions: [makeSession({ date: '2099-01-01' })] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-restWeek')).toBeTruthy();
  });
});

// ─── 2. En-t\u00eate ─────────────────────────────────────────────────────────────

describe('TodayScreen \u2014 en-t\u00eate', () => {
  it('salutation et pr\u00e9nom affich\u00e9s', async () => {
    seedReady({ profile: { ...usePulseFitStore.getState().profile, firstName: 'Jul' } });
    await render(<TodayScreen />);
    expect(screen.getAllByText(/Jul/).length).toBeGreaterThan(0);
  });

  it('avatar ouvre le profil', async () => {
    seedReady();
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByTestId('avatar-button'));
    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});

// ─── 3. Validation ───────────────────────────────────────────────────────────

describe('TodayScreen \u2014 validation', () => {
  it('action accessibilit\u00e9 « Valider » (sans maintien) : valide la s\u00e9ance', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(usePulseFitStore.getState().sessions[0].completed).toBe(true);
  });

  it('valider \u2192 UndoToast visible', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    await act(async () => void jest.advanceTimersByTime(100));
    expect(screen.getByTestId('undo-toast')).toBeTruthy();
    expect(screen.getAllByText('S\u00e9ance valid\u00e9e').length).toBeGreaterThanOrEqual(1);
  });

  it('annuler la validation restaure la s\u00e9ance', async () => {
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

// ─── 4. Report ───────────────────────────────────────────────────────────────

describe('TodayScreen \u2014 report', () => {
  it('reporter \u2192 feuille avec 4 choix', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await act(async () => void fireEvent.press(screen.getByText('Reporter')));
    expect(screen.getByTestId('postpone-cancel')).toBeTruthy(); // feuille ouverte
    expect(screen.getByTestId('postpone-demain')).toBeTruthy();
    expect(screen.getByTestId('postpone-apres-demain')).toBeTruthy();
    expect(screen.getByTestId('postpone-autre-jour')).toBeTruthy();
    expect(screen.getByTestId('postpone-sauter')).toBeTruthy();
  });

  it('choisir demain d\u00e9place la s\u00e9ance', async () => {
    const today = todayISO();
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    await act(async () => void fireEvent.press(screen.getByTestId('postpone-demain')));
    expect(usePulseFitStore.getState().sessions[0].date).not.toBe(today);
  });

  it('sauter marque la s\u00e9ance comme saut\u00e9e', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    await act(async () => void fireEvent.press(screen.getByTestId('postpone-sauter')));
    expect(usePulseFitStore.getState().sessions[0].skipped).toBe(true);
  });

  it('un autre jour est pr\u00e9sent dans la feuille', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    expect(screen.getByTestId('postpone-autre-jour')).toBeTruthy();
  });

  it('demain d\u00e9sactiv\u00e9 si s\u00e9ance existante', async () => {
    seedReady({
      sessions: [
        makeSession(),
        makeSession({ id: 'ws-2', date: isoOffset(1), title: 'Fractionn\u00e9' }),
      ],
    });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    const btn = screen.getByTestId('postpone-demain');
    expect(btn.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Journ\u00e9e d\u00e9j\u00e0 occup\u00e9e')).toBeTruthy();
  });

  it('demain d\u00e9sactiv\u00e9 si jour indisponible', async () => {
    seedReady({
      sessions: [makeSession()],
      profile: {
        ...usePulseFitStore.getState().profile,
        unavailableDates: [isoOffset(1)],
      },
    });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    const btn = screen.getByTestId('postpone-demain');
    expect(btn.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Jour d\u00e9clar\u00e9 indisponible')).toBeTruthy();
  });

  it('deux s\u00e9ances dures d\u2019afil\u00e9e refus\u00e9es', async () => {
    // S\u00e9ance dure avant-hier et aujourd'hui \u2192 demain provoquerait deux dures de suite si la pr\u00e9c\u00e9dente \u00e9tait aujourd'hui
    // On met une s\u00e9ance dure apr\u00e8s-demain \u2192 placer demain cr\u00e9e deux dures de suite
    seedReady({
      sessions: [
        makeSession({ kind: 'run' }), // aujourd'hui — d\u00e9plac\u00e9e (exclue)
        makeSession({ id: 'ws-hard', date: isoOffset(2), kind: 'run', title: 'Allure' }), // apr\u00e8s-demain
      ],
    });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    const btn = screen.getByTestId('postpone-demain');
    expect(btn.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Deux s\u00e9ances dures de suite')).toBeTruthy();
  });
});

// ─── 5. Ligne de rep\u00e8re FC ────────────────────────────────────────────────────

describe('TodayScreen \u2014 ligne de rep\u00e8re FC', () => {
  function makeRun(id: string, daysAgo: number, withHr: boolean) {
    return {
      id,
      name: 'Footing',
      type: 'run' as const,
      date: isoOffset(-daysAgo),
      startTime: '08:00',
      durationMin: 40,
      avgHr: withHr ? 150 : undefined,
      splits: [],
      hrStream: [],
      polyline: [],
    };
  }

  it('FC r\u00e9cente : aucune ligne de rep\u00e8re', async () => {
    // 5 courses dont les 5 derni\u00e8res ont toutes une FC
    const activities = [
      makeRun('r1', 10, true),
      makeRun('r2', 7, true),
      makeRun('r3', 4, true),
      makeRun('r4', 2, true),
      makeRun('r5', 0, true),
    ];
    seedReady({ sessions: [makeSession()], activities });
    await render(<TodayScreen />);
    expect(
      screen.queryByText(/je te guide \u00e0 l\u2019allure et \u00e0 la sensation/i),
    ).toBeNull();
  });

  it('sans FC r\u00e9cente : ligne de rep\u00e8re affich\u00e9e et data_quality_no_hr masqu\u00e9e', async () => {
    // 5 courses sans FC, 1 ancienne avec FC (suffisant pour d\u00e9clencher la r\u00e8gle)
    const activities = [
      makeRun('r0', 60, true), // ancienne avec FC
      makeRun('r1', 20, false),
      makeRun('r2', 15, false),
      makeRun('r3', 10, false),
      makeRun('r4', 5, false),
      makeRun('r5', 1, false),
    ];
    seedReady({ sessions: [makeSession()], activities });
    await render(<TodayScreen />);
    expect(
      screen.queryByText(/je te guide \u00e0 l\u2019allure et \u00e0 la sensation/i),
    ).toBeTruthy();
    // La CoachCard data_quality_no_hr ne doit pas appara\u00eetre en double
    const sources = screen.queryAllByTestId('coach-source');
    const deviceSources = sources.filter((s) => s.props.children === 'Calcul\u00e9 sur ton t\u00e9l\u00e9phone');
    // Si la carte data_quality est l\u00e0, elle aurait une source "Calcul\u00e9 sur ton t\u00e9l\u00e9phone"
    // On v\u00e9rifie qu'aucune carte n'affiche "Tes courses n'ont pas de mesure cardiaque"
    expect(screen.queryByText(/mesure cardiaque/i)).toBeNull();
    // Suppr\u00e8ssion de l'avertissement d'utilisation
    void deviceSources;
  });

  it('jamais eu de FC : ligne de rep\u00e8re sans date', async () => {
    // 5 courses, aucune avec FC
    const activities = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, i * 3 + 1, false));
    seedReady({ sessions: [makeSession()], activities });
    await render(<TodayScreen />);
    expect(
      screen.queryByText(/je te guide \u00e0 l\u2019allure et \u00e0 la sensation/i),
    ).toBeTruthy();
    expect(screen.queryByText(/depuis/)).toBeNull();
  });
});

// ─── 6. Source coach ─────────────────────────────────────────────────────────

describe('TodayScreen \u2014 source coach', () => {
  it('les insights on-device portent « Calcul\u00e9 sur ton t\u00e9l\u00e9phone »', async () => {
    const activities = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      name: `Footing ${i}`,
      type: 'run' as const,
      date: isoOffset(-(i * 3 + 1)),
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
      expect(source.props.children).not.toBe('R\u00e9dig\u00e9 par l\u2019IA');
    }
  });
});

// ─── 7. Donn\u00e9es absentes ─────────────────────────────────────────────────────

describe('TodayScreen \u2014 donn\u00e9es absentes', () => {
  it('aucun « 0 » affich\u00e9 pour une donn\u00e9e absente', async () => {
    seedReady({ sessions: [makeSession()] });
    const { toJSON } = await render(<TodayScreen />);
    const json = JSON.stringify(toJSON());
    const isolated = json.match(/"children":\["0"\]/g);
    expect(isolated).toBeNull();
  });
});

// ─── 8. ProposalCard ─────────────────────────────────────────────────────────

describe('TodayScreen \u2014 ProposalCard', () => {
  it('proposition en attente affich\u00e9e en mode compact', async () => {
    useProposalStore.setState({
      proposals: [
        {
          id: 'p1',
          createdAt: new Date().toISOString(),
          title: 'Sortie longue r\u00e9duite',
          source: 'agent',
          action: 'adjust_plan',
          payload: {},
          status: 'pending',
          rationale: 'Fatigue accumul\u00e9e cette semaine.',
          confidence: 0.9,
          autoApply: false,
        },
      ],
      loaded: true,
    });
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('proposal-compact')).toBeTruthy();
    expect(screen.getByText('Sortie longue r\u00e9duite')).toBeTruthy();
  });

  it('pas de proposition : section absente', async () => {
    useProposalStore.setState({ proposals: [], loaded: true });
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.queryByTestId('proposal-compact')).toBeNull();
  });
});
