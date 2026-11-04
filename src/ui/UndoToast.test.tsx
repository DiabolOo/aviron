import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { motion } from '@/src/design';
import { UndoToast } from '@/src/ui/UndoToast';

const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

function mockScreenReader(enabled: boolean) {
  jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
  return jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('UndoToast', () => {
  it('disparaît au bout de 5 s ; « Annuler » appelle onUndo', async () => {
    mockScreenReader(false);
    const onDismiss = jest.fn();
    const onUndo = jest.fn();
    await render(<UndoToast visible message="Séance validée" onUndo={onUndo} onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByText('Annuler'));
    expect(onUndo).toHaveBeenCalled();
    await advance(motion.undo - 1);
    expect(onDismiss).not.toHaveBeenCalled();
    await advance(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('décompte en pause tant qu’on le touche, puis reprend où il en était', async () => {
    mockScreenReader(false);
    const onDismiss = jest.fn();
    await render(<UndoToast visible message="Plan modifié" onUndo={jest.fn()} onDismiss={onDismiss} />);
    await advance(2000);
    await fireEvent(screen.getByTestId('undo-toast'), 'touchStart');
    await advance(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('undo-toast'), 'touchEnd');
    await advance(motion.undo - 2000 - 1);
    expect(onDismiss).not.toHaveBeenCalled();
    await advance(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('lecteur d’écran actif : bandeau annoncé, aucune disparition automatique', async () => {
    const announce = mockScreenReader(true);
    const onDismiss = jest.fn();
    await render(<UndoToast visible message="Séance validée" onUndo={jest.fn()} onDismiss={onDismiss} />);
    await advance(motion.undo * 4);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith('Séance validée. Annuler disponible.');
    expect(screen.getByTestId('undo-toast')).toBeTruthy();
  });
});
