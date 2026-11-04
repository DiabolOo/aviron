import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { motion } from '@/src/design';
import { SessionCard, type SessionCardProps } from '@/src/ui/SessionCard';
import { withPreview } from '@/src/ui/v3-test-utils';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('lucide-react-native', () => ({ Check: () => null }));

const props = (over: Partial<SessionCardProps> = {}): SessionCardProps => ({
  eyebrow: 'Séance du jour',
  title: 'Footing 8 km',
  effort: { level: 'easy' },
  instruction: 'Allure où tu peux parler.',
  status: 'planned',
  onValidate: jest.fn(),
  onPostpone: jest.fn(),
  onUndo: jest.fn(),
  ...over,
});

const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe('SessionCard — états', () => {
  it('à faire : pastille, titre, consigne, repère, « Reporter », piste', async () => {
    const p = props({ note: 'Pas de cardio cette semaine.' });
    await render(<SessionCard {...p} />);
    expect(screen.getByText('Footing 8 km')).toBeTruthy();
    expect(screen.getByText('Facile')).toBeTruthy();
    expect(screen.getByText('Pas de cardio cette semaine.')).toBeTruthy();
    expect(screen.getByTestId('hold-track')).toBeTruthy();
    await fireEvent.press(screen.getByText('Reporter'));
    expect(p.onPostpone).toHaveBeenCalled();
  });

  it('validée : « Séance validée »', async () => {
    await render(<SessionCard {...props({ status: 'done' })} />);
    expect(screen.getByTestId('session-card-done')).toBeTruthy();
    expect(screen.getByText('Séance validée')).toBeTruthy();
  });

  it('reportée : « Reportée à demain » + « Annuler »', async () => {
    const p = props({ status: 'postponed' });
    await render(<SessionCard {...p} />);
    expect(screen.getByText('Reportée à demain')).toBeTruthy();
    await fireEvent.press(screen.getByText('Annuler'));
    expect(p.onUndo).toHaveBeenCalled();
  });
});

describe('SessionCard — validation par maintien', () => {
  it('relâché avant 600 ms : rien', async () => {
    const p = props();
    await render(<SessionCard {...p} />);
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'pressIn');
    await advance(motion.hold - 1);
    await fireEvent(card, 'pressOut');
    await advance(motion.hold);
    expect(p.onValidate).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('maintenu 600 ms : validé, haptique au début et à la fin', async () => {
    const p = props();
    await render(<SessionCard {...p} />);
    await fireEvent(screen.getByTestId('session-card-planned'), 'pressIn');
    await advance(motion.hold);
    expect(p.onValidate).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it('« réduire les animations » : le geste de 600 ms est conservé', async () => {
    const p = props();
    await render(withPreview({ reduceMotion: true }, <SessionCard {...p} />));
    const card = screen.getByTestId('session-card-planned');
    await fireEvent(card, 'pressIn');
    await advance(motion.hold - 1);
    expect(p.onValidate).not.toHaveBeenCalled();
    await advance(1);
    expect(p.onValidate).toHaveBeenCalledTimes(1);
  });

  it('accessibilité : action « Valider », activable sans maintien', async () => {
    const p = props();
    await render(<SessionCard {...p} />);
    const card = screen.getByTestId('session-card-planned');
    expect(card.props.accessibilityActions).toEqual([{ name: 'activate', label: 'Valider' }]);
    await fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(p.onValidate).toHaveBeenCalledTimes(1);
  });
});
