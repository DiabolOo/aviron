import { render, screen } from '@testing-library/react-native';

import { usePulseFitStore } from '@/lib/store';

import { ProfileScreen } from './ProfileScreen';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
}));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ChevronRight: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function seedReady(patch: Partial<ReturnType<typeof usePulseFitStore.getState>> = {}) {
  usePulseFitStore.setState((state) => ({
    dataReady: true,
    activities: [],
    sessions: [],
    profile: { ...state.profile, firstName: 'Jul', level: 'advanced' as const },
    ...patch,
  }));
}

beforeEach(() => jest.clearAllMocks());

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ProfileScreen', () => {
  it('affiche le BackHeader avec Fermer', async () => {
    seedReady();
    await render(<ProfileScreen />);
    expect(screen.getByTestId('back-header')).toBeTruthy();
    expect(screen.getByText('Fermer')).toBeTruthy();
  });

  it('affiche l’avatar et le prénom', async () => {
    seedReady();
    await render(<ProfileScreen />);
    expect(screen.getByTestId('profile-screen')).toBeTruthy();
    expect(screen.getByText('Jul')).toBeTruthy();
    expect(screen.getByText('J')).toBeTruthy();
  });

  it('affiche les sections Toi et Personnalisation', async () => {
    seedReady();
    await render(<ProfileScreen />);
    expect(screen.getByText('Toi')).toBeTruthy();
    expect(screen.getByText('Personnalisation')).toBeTruthy();
  });

  it('affiche le niveau et l’équipement', async () => {
    seedReady();
    await render(<ProfileScreen />);
    expect(screen.getByTestId('settings-level')).toBeTruthy();
    expect(screen.getByTestId('settings-equipment')).toBeTruthy();
  });

  it('affiche le toggle consentement IA', async () => {
    seedReady();
    await render(<ProfileScreen />);
    expect(screen.getByTestId('settings-ai-consent')).toBeTruthy();
  });
});
