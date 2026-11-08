import { render, screen, fireEvent } from '@testing-library/react-native';

import type { Activity } from '@/src/core/schemas';
import { groupSessions, resolveSession } from '@/src/core/training/sessions';
import { buildSessionView } from '@/src/core/training/sessions/sessionView';
import { DEBRIEF_NO_FC, STRENGTH_FC_NOTE } from '@/src/core/training/insights/copy.fr';
import { withPreview } from '@/src/ui/v3-test-utils';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ id: 'run1' })),
}));

jest.mock('lucide-react-native', () => {
  const View = require('react-native').View;
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...rest }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View {...rest}>{children}</View>;
  },
}));

// Mock store
const mockStore: Record<string, unknown> = {};

jest.mock('@/lib/store', () => ({
  usePulseFitStore: (selector: (s: Record<string, unknown>) => unknown) => selector(mockStore),
}));

// Mock sportDerived
const mockDerived = {
  confirmedRaceMap: new Map<string, string>(),
  highlightFor: () => null,
  comparisonFor: () => null,
  raceDebrief: () => undefined,
  raceSummaryFor: () => undefined,
};

jest.mock('@/src/ui/useRaces', () => ({
  useSportDerived: () => mockDerived,
}));

jest.mock('@/src/ui/nav', () => ({
  perfLog: jest.fn(),
  openActivity: jest.fn(),
}));

// ── Test data ───────────────────────────────────────────────────────────────

function makeActivity(overrides: Partial<Activity> & { id: string }): Activity {
  return {
    name: 'Course du matin',
    type: 'run',
    date: '2026-05-20',
    startTime: '10:14:00',
    durationMin: 45,
    movingTimeSec: 2700,
    distanceKm: 9.1,
    elevationM: 42,
    avgHr: 158,
    maxHr: 176,
    source: 'strava',
    aiEligible: false,
    splits: [],
    hrStream: [],
    polyline: [],
    ...overrides,
  };
}

const RUN: Activity = makeActivity({ id: 'run1' });

const WALK: Activity = makeActivity({
  id: 'walk1',
  name: 'Morning Walk',
  type: 'walk',
  distanceKm: 5.2,
  durationMin: 78,
  movingTimeSec: 4680,
  avgHr: 110,
  maxHr: 130,
  elevationM: 15,
});

const RIDE: Activity = makeActivity({
  id: 'ride1',
  name: 'Lunch Ride',
  type: 'ride',
  distanceKm: 42.5,
  durationMin: 95,
  movingTimeSec: 5400,
  avgHr: 145,
  maxHr: 170,
  elevationM: 380,
});

const SWIM: Activity = makeActivity({
  id: 'swim1',
  name: 'Morning Swim',
  type: 'swim',
  distanceKm: 1.5,
  durationMin: 35,
  movingTimeSec: 2100,
  avgHr: 140,
  maxHr: 165,
  elevationM: undefined,
});

const STRENGTH: Activity = makeActivity({
  id: 'str1',
  name: 'Weight Training',
  type: 'strength',
  distanceKm: undefined,
  durationMin: 68,
  movingTimeSec: 4080,
  avgHr: 104,
  maxHr: 159,
  elevationM: undefined,
});

const WARMUP: Activity = makeActivity({
  id: 'warmup1',
  name: 'Échauffement',
  type: 'run',
  date: '2026-05-20',
  startTime: '12:00:00',
  durationMin: 10.57,
  movingTimeSec: 634,
  distanceKm: 2.0,
  avgHr: 140,
  maxHr: 155,
});

const MAIN_BLOCK: Activity = makeActivity({
  id: 'main1',
  name: 'Bloc rapide',
  type: 'run',
  date: '2026-05-20',
  startTime: '12:12:00',
  durationMin: 12.05,
  movingTimeSec: 723,
  distanceKm: 3.3,
  avgHr: 185,
  maxHr: 201,
});

const COOLDOWN: Activity = makeActivity({
  id: 'cool1',
  name: 'Retour au calme',
  type: 'run',
  date: '2026-05-20',
  startTime: '12:25:00',
  durationMin: 17.47,
  movingTimeSec: 1048,
  distanceKm: 2.6,
  avgHr: 145,
  maxHr: 160,
});

// ── Helper ──────────────────────────────────────────────────────────────────

function setStoreActivities(activities: Activity[]) {
  // Convert Activity to StravaActivity-like format (the store uses StravaActivity)
  mockStore.activities = activities.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    date: a.date,
    startTime: a.startTime,
    durationMin: a.durationMin,
    movingTimeSec: a.movingTimeSec,
    distanceKm: a.distanceKm,
    elevationM: a.elevationM,
    calories: undefined,
    avgHr: a.avgHr,
    maxHr: a.maxHr,
    startCity: undefined,
    splits: a.splits ?? [],
    hrStream: a.hrStream ?? [],
    polyline: a.polyline ?? [],
  }));
  mockStore.groupOverrides = [];
  mockStore.addGroupOverride = jest.fn();
  mockStore.removeGroupOverride = jest.fn();
}

function setId(id: string) {
  const { useLocalSearchParams } = require('expo-router');
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id });
}

function renderScreen() {
  const ActivityScreen = require('@/src/screens/activity/ActivityScreen').ActivityScreen;
  return render(<ActivityScreen />);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDerived.confirmedRaceMap = new Map();
    mockDerived.raceDebrief = () => undefined;
    mockDerived.raceSummaryFor = () => undefined;
    mockDerived.highlightFor = () => null;
    mockDerived.comparisonFor = () => null;
  });

  // ── Sport-specific rendering ──────────────────────────────────────────

  it('course : allure en heros, FC dans les metriques', async () => {
    setId('run1');
    setStoreActivities([RUN]);
    await renderScreen();

    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    expect(screen.getByTestId('hero-metric')).toBeTruthy();
    expect(screen.getByText('158 bpm')).toBeTruthy();
  });

  it('marche : allure min/km en héros', async () => {
    setId('walk1');
    setStoreActivities([WALK]);
    await renderScreen();

    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    expect(screen.getByTestId('hero-metric')).toBeTruthy();
    // Walk uses /km unit
    expect(screen.getByText('/km')).toBeTruthy();
  });

  it('vélo : vitesse km/h en héros', async () => {
    setId('ride1');
    setStoreActivities([RIDE]);
    await renderScreen();

    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    expect(screen.getByText('km/h')).toBeTruthy();
  });

  it('natation : allure /100 m en héros', async () => {
    setId('swim1');
    setStoreActivities([SWIM]);
    await renderScreen();

    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    expect(screen.getByText('/100 m')).toBeTruthy();
  });

  it('muscu : durée en héros, note FC affichée', async () => {
    setId('str1');
    setStoreActivities([STRENGTH]);
    await renderScreen();

    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    expect(screen.getByText(STRENGTH_FC_NOTE)).toBeTruthy();
    expect(screen.getByTestId('effort-neutral')).toBeTruthy();
  });

  // ── Grouped session ───────────────────────────────────────────────────

  it('séance regroupée : barre colorée et bouton Séparer', async () => {
    setId('s_warmup1');
    setStoreActivities([WARMUP, MAIN_BLOCK, COOLDOWN]);
    await renderScreen();

    expect(screen.getByTestId('session-parts')).toBeTruthy();
    expect(screen.getAllByTestId('session-segment')).toHaveLength(3);
    expect(screen.getByText('Séparer')).toBeTruthy();
  });

  it('séparer une séance regroupée appelle addGroupOverride', async () => {
    setId('s_warmup1');
    setStoreActivities([WARMUP, MAIN_BLOCK, COOLDOWN]);
    await renderScreen();

    fireEvent.press(screen.getByText('Séparer'));
    expect(mockStore.addGroupOverride).toHaveBeenCalled();
  });

  // ── Race with FC ──────────────────────────────────────────────────────

  it('course confirmée avec FC : temps en héros, bandes, pas de DEBRIEF_NO_FC', async () => {
    setId('run1');
    setStoreActivities([RUN]);
    mockDerived.confirmedRaceMap = new Map([['run1', 'race-run1']]);
    mockDerived.raceDebrief = () => ({
      race: {
        id: 'race-run1',
        activityId: 'run1',
        officialDistanceKm: 21.1,
        measuredDistanceKm: 21.88,
        date: '2026-10-11',
        status: 'completed',
        timeSec: 6789,
        name: 'Semi de Reims',
      },
      title: 'Semi de Reims',
      confirmed: true,
      timeSec: 6789,
      officialPaceSec: 322,
      distanceNote: { short: 'Mesurée 21,88 km', detail: 'détail' },
      pacing: {
        title: 'Ton départ était un peu trop rapide',
        message: 'test',
        extras: [],
        summary: 'Ta 2e moitié est 5 % plus lente.',
        why: 'Explication',
      },
      bands: [
        { label: 'Q1', fromKm: 0, toKm: 5.3, officialPaceSec: 355 },
        { label: 'Q2', fromKm: 5.3, toKm: 10.5, officialPaceSec: 327 },
        { label: 'Q3', fromKm: 10.5, toKm: 15.8, officialPaceSec: 326 },
        { label: 'Q4', fromKm: 15.8, toKm: 21.1, officialPaceSec: 288 },
      ],
      averagePaceSec: 322,
      hr: {
        halves: {
          first: { paceSec: 340, officialPaceSec: 340, avgHr: 160 },
          second: { paceSec: 310, officialPaceSec: 310, avgHr: 170 },
        },
        driftSentence: 'Ta FC a grimpé de 10 bpm en 2e moitié.',
      },
      halfPaces: { first: 340, second: 310 },
      comparison: [],
    }) as never;

    await renderScreen();

    expect(screen.getByText('Semi de Reims')).toBeTruthy();
    expect(screen.getByTestId('race-bands')).toBeTruthy();
    expect(screen.getAllByTestId('race-band-bar')).toHaveLength(4);
    expect(screen.getByTestId('drift-sentence')).toBeTruthy();
    expect(screen.queryByText(DEBRIEF_NO_FC)).toBeNull();
  });

  // ── Race without FC ───────────────────────────────────────────────────

  it('course confirmée sans FC : formulation prudente', async () => {
    setId('run1');
    const noHrRun = makeActivity({ id: 'run1', avgHr: undefined, maxHr: undefined });
    setStoreActivities([noHrRun]);
    mockDerived.confirmedRaceMap = new Map([['run1', 'race-run1']]);
    mockDerived.raceDebrief = () => ({
      race: {
        id: 'race-run1',
        activityId: 'run1',
        officialDistanceKm: 21.1,
        date: '2026-10-11',
        status: 'completed',
        timeSec: 6789,
        name: 'Semi de Reims',
      },
      title: 'Semi de Reims',
      confirmed: true,
      timeSec: 6789,
      officialPaceSec: 322,
      bands: [
        { label: 'Q1', fromKm: 0, toKm: 5.3, officialPaceSec: 355 },
        { label: 'Q4', fromKm: 15.8, toKm: 21.1, officialPaceSec: 288 },
      ],
      averagePaceSec: 322,
      comparison: [],
    }) as never;

    await renderScreen();

    expect(screen.getByText(DEBRIEF_NO_FC)).toBeTruthy();
    expect(screen.queryByTestId('drift-sentence')).toBeNull();
  });

  // ── Missing data ──────────────────────────────────────────────────────

  it('donnée manquante : activité introuvable → EmptyState', async () => {
    setId('nonexistent');
    setStoreActivities([RUN]);
    await renderScreen();

    expect(screen.getByText('Activité introuvable')).toBeTruthy();
  });

  it('donnée manquante : pas de FC → pastille Sans cardio', async () => {
    setId('run1');
    const noHrRun = makeActivity({ id: 'run1', avgHr: undefined, maxHr: undefined });
    setStoreActivities([noHrRun]);
    await renderScreen();

    expect(screen.getByTestId('effort-neutral')).toBeTruthy();
  });

  // ── Activity id → session resolution ──────────────────────────────────

  it("id d'activite resolu vers sa seance regroupee", async () => {
    // Using the main block's id should resolve to the grouped session
    setId('main1');
    setStoreActivities([WARMUP, MAIN_BLOCK, COOLDOWN]);
    await renderScreen();

    // Should show the grouped session, not just the main block
    expect(screen.getByTestId('session-parts')).toBeTruthy();
    expect(screen.getByText(/3 activités regroupées/)).toBeTruthy();
  });

  // ── v3.4 polish: BackHeader + SourceChip + strength zone ───────────

  it('BackHeader "Semaine" affiché', async () => {
    setId('run1');
    setStoreActivities([RUN]);
    await renderScreen();
    expect(screen.getByTestId('back-header')).toBeTruthy();
  });

  it('SourceChip affiché avec la source', async () => {
    setId('run1');
    setStoreActivities([RUN]);
    await renderScreen();
    expect(screen.getByTestId('source-chip')).toBeTruthy();
  });

  it('muscu : question "Qu\'as-tu travaillé ?" avec 4 choix', async () => {
    setId('str1');
    setStoreActivities([STRENGTH]);
    await renderScreen();
    expect(screen.getByText(/Qu.as-tu travaill/)).toBeTruthy();
    expect(screen.getByTestId('choice-upper')).toBeTruthy();
    expect(screen.getByTestId('choice-legs')).toBeTruthy();
    expect(screen.getByTestId('choice-full')).toBeTruthy();
    expect(screen.getByTestId('choice-core')).toBeTruthy();
  });

  it('course : pas de question muscu', async () => {
    setId('run1');
    setStoreActivities([RUN]);
    await renderScreen();
    expect(screen.queryByTestId('choice-upper')).toBeNull();
  });

  // ── Text at ×2 ────────────────────────────────────────────────────────

  it("texte lisible a x2 : l'ecran rend sans erreur", async () => {
    setId('run1');
    setStoreActivities([RUN]);
    const ActivityScreen = require('@/src/screens/activity/ActivityScreen').ActivityScreen;
    const { unmount } = await render(withPreview({ fontScale: 2 }, <ActivityScreen />));
    expect(screen.getByTestId('activity-screen')).toBeTruthy();
    unmount();
  });
});

// ── Unit tests for sessionView ──────────────────────────────────────────────

describe('buildSessionView', () => {
  it('single run activity → distance layout, allure en héros', () => {
    const map = new Map([[RUN.id, RUN]]);
    const { sessions } = groupSessions([RUN]);
    const view = buildSessionView(sessions[0], map);

    expect(view.layout.showDistance).toBe(true);
    expect(view.heroUnit).toBe('/km');
    expect(view.isGrouped).toBe(false);
    expect(view.parts).toHaveLength(1);
  });

  it("strength: duree en heros, pas d'unite", () => {
    const map = new Map([[STRENGTH.id, STRENGTH]]);
    const { sessions } = groupSessions([STRENGTH]);
    const view = buildSessionView(sessions[0], map);

    expect(view.layout.showDistance).toBe(false);
    expect(view.heroUnit).toBeUndefined();
    expect(view.isGrouped).toBe(false);
  });

  it('grouped session → isGrouped true, parts with roles', () => {
    const acts = [WARMUP, MAIN_BLOCK, COOLDOWN];
    const map = new Map(acts.map((a) => [a.id, a]));
    const { sessions } = groupSessions(acts, [
      { type: 'role', activityId: 'warmup1', role: 'warmup' },
      { type: 'role', activityId: 'main1', role: 'main' },
      { type: 'role', activityId: 'cool1', role: 'cooldown' },
    ]);
    const view = buildSessionView(sessions[0], map);

    expect(view.isGrouped).toBe(true);
    expect(view.parts).toHaveLength(3);
    expect(view.parts[0].roleLabel).toBe('Échauffement');
    expect(view.parts[1].roleLabel).toBe('Bloc rapide');
    expect(view.parts[2].roleLabel).toBe('Retour au calme');
    expect(view.groupLabel).toBe('3 activités regroupées');
  });
});

describe('resolveSession', () => {
  it('activity id resolves to containing session', () => {
    const acts = [WARMUP, MAIN_BLOCK, COOLDOWN];
    const { sessions } = groupSessions(acts);

    const resolved = resolveSession(sessions, 'main1');
    expect(resolved).toBeDefined();
    expect(resolved!.activityIds).toContain('main1');
    expect(resolved!.activityIds).toContain('warmup1');
  });
});
