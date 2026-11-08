import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/src/design';
import { EffortPill } from '@/src/ui/EffortPill';

describe('EffortPill', () => {
  it.each([
    ['easy', 'Facile', colors.light.effortEasySurface],
    ['moderate', 'Correct', colors.light.effortModerateSurface],
    ['hard', 'Dur', colors.light.effortHardSurface],
  ] as const)('ressenti %s : le mot « %s » est toujours affiché, avec sa couleur', async (level, word, surface) => {
    await render(<EffortPill level={level} scale="felt" />);
    expect(screen.getByText(word)).toBeTruthy();
    const pill = screen.getByTestId(`effort-${level}`);
    expect(StyleSheet.flatten(pill.props.style).backgroundColor).toBe(surface);
    expect(pill.props.accessibilityLabel).toBe(`Ressenti : ${word}`);
  });

  it.each([
    ['easy', 'Facile'],
    ['moderate', 'Soutenu'],
    ['hard', 'Intense'],
  ] as const)('intensité prévue %s : « %s »', async (level, word) => {
    await render(<EffortPill level={level} scale="planned" />);
    expect(screen.getByText(word)).toBeTruthy();
    expect(screen.getByTestId(`effort-${level}`).props.accessibilityLabel).toBe(`Effort : ${word}`);
  });

  it('neutral : un mot qui dit pourquoi, sans point de couleur', async () => {
    await render(<EffortPill level="neutral" label="Sans cardio" />);
    expect(screen.getByText('Sans cardio')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('effort-neutral').props.style).backgroundColor).toBe(colors.light.surfaceSunken);
  });
});
