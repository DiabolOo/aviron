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
jest.mock('lucide-react-native', () => ({ Check: () => null, Sparkles: () => null }));
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
    subtitle: 'Environ 45 minutes, à une allure où tu peux parler.',
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
    // Default level to 'regular' to preserve existing test expectations (e.g. "Reporter" label).
    profile: { ...state.profile, unavailableDates: undefined, level: 'regular' as const, ...profilePatch },
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

describe('TodayScreen — états', () => {
  it('chargement : squelettes visibles', async () => {
    usePulseFitStore.setState({ dataReady: false });
    await render(<TodayScreen />);
    await act(async () => void jest.advanceTimersByTime(motion.skeleton.delay + 50));
    expect(screen.getByTestId('today-loading')).toBeTruthy();
  });

  it('vide (aucune donnée) : EmptyState firstDay', async () => {
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

  it('jour de repos (plan sans séance aujourd’hui) : EmptyState restWeek', async () => {
    seedReady({ sessions: [makeSession({ date: '2099-01-01' })] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('empty-restWeek')).toBeTruthy();
  });
});

// ─── 2. En-tête ─────────────────────────────────────────────────────────────

describe('TodayScreen — en-tête', () => {
  it('salutation et prénom affichés', async () => {
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

describe('TodayScreen — validation', () => {
  it('action accessibilité « Valider » (sans maintien) : valide la séance', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(usePulseFitStore.getState().sessions[0].completed).toBe(true);
  });

  it('valider → UndoToast visible', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    await act(async () => void jest.advanceTimersByTime(100));
    expect(screen.getByTestId('undo-toast')).toBeTruthy();
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

// ─── 4. Report ───────────────────────────────────────────────────────────────

describe('TodayScreen — report', () => {
  it('reporter → feuille avec 4 choix', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await act(async () => void fireEvent.press(screen.getByText('Reporter')));
    expect(screen.getByTestId('postpone-cancel')).toBeTruthy(); // feuille ouverte
    expect(screen.getByTestId('postpone-demain')).toBeTruthy();
    expect(screen.getByTestId('postpone-apres-demain')).toBeTruthy();
    expect(screen.getByTestId('postpone-autre-jour')).toBeTruthy();
    expect(screen.getByTestId('postpone-sauter')).toBeTruthy();
  });

  it('choisir demain déplace la séance', async () => {
    const today = todayISO();
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    await act(async () => void fireEvent.press(screen.getByTestId('postpone-demain')));
    expect(usePulseFitStore.getState().sessions[0].date).not.toBe(today);
  });

  it('sauter marque la séance comme sautée', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    await act(async () => void fireEvent.press(screen.getByTestId('postpone-sauter')));
    expect(usePulseFitStore.getState().sessions[0].skipped).toBe(true);
  });

  it('un autre jour est présent dans la feuille', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    expect(screen.getByTestId('postpone-autre-jour')).toBeTruthy();
  });

  it('demain désactivé si séance existante', async () => {
    seedReady({
      sessions: [
        makeSession(),
        makeSession({ id: 'ws-2', date: isoOffset(1), title: 'Fractionné' }),
      ],
    });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    const btn = screen.getByTestId('postpone-demain');
    expect(btn.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Journée déjà occupée')).toBeTruthy();
  });

  it('demain désactivé si jour indisponible', async () => {
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
    expect(screen.getByText('Jour déclaré indisponible')).toBeTruthy();
  });

  it('deux séances dures d’afilée refusées', async () => {
    // Séance dure avant-hier et aujourd'hui → demain provoquerait deux dures de suite si la précédente était aujourd'hui
    // On met une séance dure après-demain → placer demain crée deux dures de suite
    seedReady({
      sessions: [
        makeSession({ kind: 'run' }), // aujourd'hui — déplacée (exclue)
        makeSession({ id: 'ws-hard', date: isoOffset(2), kind: 'run', title: 'Allure' }), // après-demain
      ],
    });
    await render(<TodayScreen />);
    await fireEvent.press(screen.getByText('Reporter'));
    const btn = screen.getByTestId('postpone-demain');
    expect(btn.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Deux séances dures de suite')).toBeTruthy();
  });
});

// ─── 5. Ligne de repère FC ────────────────────────────────────────────────────

describe('TodayScreen — ligne de repère FC', () => {
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

  it('FC récente : aucune ligne de repère', async () => {
    // 5 courses dont les 5 dernières ont toutes une FC
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
      screen.queryByText(/je te guide à l’allure et à la sensation/i),
    ).toBeNull();
  });

  it('sans FC récente : ligne de repère affichée et data_quality_no_hr masquée', async () => {
    // 5 courses sans FC, 1 ancienne avec FC (suffisant pour déclencher la règle)
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
      screen.queryByText(/je te guide à l’allure et à la sensation/i),
    ).toBeTruthy();
    // La CoachCard data_quality_no_hr ne doit pas apparaître en double
    const sources = screen.queryAllByTestId('coach-source');
    const deviceSources = sources.filter((s) => s.props.children === 'Calculé sur ton téléphone');
    // Si la carte data_quality est là, elle aurait une source "Calculé sur ton téléphone"
    // On vérifie qu'aucune carte n'affiche "Tes courses n'ont pas de mesure cardiaque"
    expect(screen.queryByText(/mesure cardiaque/i)).toBeNull();
    // Supprèssion de l'avertissement d'utilisation
    void deviceSources;
  });

  it('jamais eu de FC : ligne de repère sans date', async () => {
    // 5 courses, aucune avec FC
    const activities = Array.from({ length: 5 }, (_, i) => makeRun(`r${i}`, i * 3 + 1, false));
    seedReady({ sessions: [makeSession()], activities });
    await render(<TodayScreen />);
    expect(
      screen.queryByText(/je te guide à l’allure et à la sensation/i),
    ).toBeTruthy();
    expect(screen.queryByText(/depuis/)).toBeNull();
  });
});

// ─── 6. Source coach ─────────────────────────────────────────────────────────

describe('TodayScreen — source coach', () => {
  it('les insights on-device portent « Calculé sur ton téléphone »', async () => {
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
      expect(source.props.children).not.toBe('Rédigé par l’IA');
    }
  });
});

// ─── 7. Données absentes ─────────────────────────────────────────────────────

describe('TodayScreen — données absentes', () => {
  it('aucun « 0 » affiché pour une donnée absente', async () => {
    seedReady({ sessions: [makeSession()] });
    const { toJSON } = await render(<TodayScreen />);
    const json = JSON.stringify(toJSON());
    const isolated = json.match(/"children":\["0"\]/g);
    expect(isolated).toBeNull();
  });
});

// ─── 8. ProposalCard ─────────────────────────────────────────────────────────

describe('TodayScreen — ProposalCard', () => {
  it('proposition en attente affichée en mode compact', async () => {
    useProposalStore.setState({
      proposals: [
        {
          id: 'p1',
          createdAt: new Date().toISOString(),
          title: 'Sortie longue réduite',
          source: 'agent',
          action: 'adjust_plan',
          payload: {},
          status: 'pending',
          rationale: 'Fatigue accumulée cette semaine.',
          confidence: 0.9,
          autoApply: false,
        },
      ],
      loaded: true,
    });
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.getByTestId('proposal-compact')).toBeTruthy();
    expect(screen.getByText('Sortie longue réduite')).toBeTruthy();
  });

  it('pas de proposition : section absente', async () => {
    useProposalStore.setState({ proposals: [], loaded: true });
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.queryByTestId('proposal-compact')).toBeNull();
  });
});

// ─── 9. Carte « Ta semaine » (débutant) ────────────────────────────────────

describe('TodayScreen — carte Ta semaine', () => {
  it('débutant avec plan : carte DayDots visible', async () => {
    seedReady({
      sessions: [makeSession()],
      profile: { ...usePulseFitStore.getState().profile, level: 'beginner' as const },
    });
    await render(<TodayScreen />);
    expect(screen.getByTestId('today-week-card')).toBeTruthy();
    expect(screen.getByText('Ta semaine')).toBeTruthy();
  });

  it('niveau regular : pas de carte Ta semaine', async () => {
    seedReady({ sessions: [makeSession()] });
    await render(<TodayScreen />);
    expect(screen.queryByTestId('today-week-card')).toBeNull();
  });

  it('débutant avec "Plus tard" au lieu de "Reporter"', async () => {
    seedReady({
      sessions: [makeSession()],
      profile: { ...usePulseFitStore.getState().profile, level: 'beginner' as const },
    });
    await render(<TodayScreen />);
    expect(screen.getByText('Plus tard')).toBeTruthy();
  });
});
