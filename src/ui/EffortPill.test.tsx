import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { colors } from '@/src/design';
import { EffortPill } from '@/src/ui/EffortPill';

describe('EffortPill', () => {
  it.each([
    ['easy', 'Facile', colors.light.effortEasySurface],
    ['moderate', 'Correct', colors.light.effortModerateSurface],
    ['hard', 'Dur', colors.light.effortHardSurface],
  ] as const)('%s : le mot « %s » est toujours affiché, avec sa couleur', async (level, word, surface) => {
    await render(<EffortPill level={level} />);
    expect(screen.getByText(word)).toBeTruthy();
    const pill = screen.getByTestId(`effort-${level}`);
    expect(StyleSheet.flatten(pill.props.style).backgroundColor).toBe(surface);
    expect(pill.props.accessibilityLabel).toBe(`Effort : ${word}`);
  });

  it('neutral : un mot qui dit pourquoi, sans point de couleur', async () => {
    await render(<EffortPill level="neutral" label="Sans cardio" />);
    expect(screen.getByText('Sans cardio')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('effort-neutral').props.style).backgroundColor).toBe(colors.light.surfaceSunken);
  });
});
