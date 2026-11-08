import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';

import { OnboardingScreen } from './OnboardingScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => {
  jest.clearAllMocks();
  usePulseFitStore.setState({ stravaConnected: false, hasCompletedOnboarding: false });
});

/** Sélectionne un choix, attend que Continuer soit actif, puis avance. */
async function selectAndContinue(testID: string) {
  const option = await screen.findByTestId(testID);
  fireEvent.press(option);
  await waitFor(() =>
    expect(screen.getByTestId('continue-button').props.accessibilityState?.disabled).toBeFalsy(),
  );
  fireEvent.press(screen.getByTestId('continue-button'));
}

/** Navigue jusqu'à l'étape n (0-indexé). */
async function goToStep(step: number) {
  const path: string[] = [];
  if (step >= 1) path.push('level-regular');
  if (step >= 2) path.push('equipment-phone');
  if (step >= 3) path.push('goal-regular');
  for (const id of path) {
    await selectAndContinue(id);
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('OnboardingScreen', () => {
  it('affiche l’étape 1 avec les 3 niveaux', async () => {
    await render(<OnboardingScreen />);
    expect(screen.getByTestId('onboarding-screen')).toBeTruthy();
    expect(screen.getByTestId('step-header')).toBeTruthy();
    expect(screen.getByTestId('level-beginner')).toBeTruthy();
    expect(screen.getByTestId('level-regular')).toBeTruthy();
    expect(screen.getByTestId('level-advanced')).toBeTruthy();
  });

  it('bouton Continuer désactivé sans sélection', async () => {
    await render(<OnboardingScreen />);
    const btn = screen.getByTestId('continue-button');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('passe à l’étape 2 après sélection du niveau', async () => {
    await render(<OnboardingScreen />);
    await selectAndContinue('level-regular');
    expect(await screen.findByTestId('equipment-hrWatch')).toBeTruthy();
    expect(screen.getByTestId('equipment-phone')).toBeTruthy();
    expect(screen.getByTestId('equipment-none')).toBeTruthy();
  });

  it('passe à l’étape 3 (objectif) avec 4 choix', async () => {
    await render(<OnboardingScreen />);
    await goToStep(2);
    expect(await screen.findByTestId('goal-semi')).toBeTruthy();
    expect(screen.getByTestId('goal-10k')).toBeTruthy();
    expect(screen.getByTestId('goal-5k')).toBeTruthy();
    expect(screen.getByTestId('goal-regular')).toBeTruthy();
  });

  it('affiche les champs date/temps pour un semi', async () => {
    await render(<OnboardingScreen />);
    await goToStep(2);
    const semi = await screen.findByTestId('goal-semi');
    fireEvent.press(semi);
    expect(await screen.findByTestId('target-time')).toBeTruthy();
    expect(screen.getByTestId('target-date')).toBeTruthy();
  });

  it('n’affiche pas les champs date pour régularité', async () => {
    await render(<OnboardingScreen />);
    await goToStep(2);
    const regular = await screen.findByTestId('goal-regular');
    fireEvent.press(regular);
    await waitFor(() =>
      expect(screen.getByTestId('continue-button').props.accessibilityState?.disabled).toBeFalsy(),
    );
    expect(screen.queryByTestId('target-time')).toBeNull();
    expect(screen.queryByTestId('target-date')).toBeNull();
  });

  it('étape 4 : consentement avec 3 choix', async () => {
    await render(<OnboardingScreen />);
    await goToStep(3);
    expect(await screen.findByTestId('consent-profile')).toBeTruthy();
    expect(screen.getByTestId('consent-sessions')).toBeTruthy();
    expect(screen.getByTestId('consent-ai')).toBeTruthy();
    expect(screen.getByText('Commencer')).toBeTruthy();
  });

  it('affiche la note Strava si connecté', async () => {
    usePulseFitStore.setState({ stravaConnected: true });
    await render(<OnboardingScreen />);
    await goToStep(3);
    expect(await screen.findByText('Tes séances arrivent par Strava')).toBeTruthy();
  });

  it('complète l’onboarding et navigue vers les onglets', async () => {
    const { router } = require('expo-router');
    await render(<OnboardingScreen />);
    await goToStep(3);
    await selectAndContinue('consent-sessions');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    expect(usePulseFitStore.getState().hasCompletedOnboarding).toBe(true);
  });
});
