import { render } from '@testing-library/react-native';
import { Text, type ColorSchemeName } from 'react-native';

import { makeStyles } from './makeStyles';
import { colors, type Theme } from './theme';
import { useTheme } from './useTheme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockScheme = jest.requireMock<{ default: jest.Mock<ColorSchemeName | 'unspecified' | null, []> }>(
  'react-native/Libraries/Utilities/useColorScheme',
).default;

const useStyles = makeStyles((t) => ({ card: { backgroundColor: t.colors.surface, padding: t.space.screen } }));

let seen: { theme: Theme; styles: ReturnType<typeof useStyles> }[] = [];

function Probe() {
  seen.push({ theme: useTheme(), styles: useStyles() });
  return <Text>probe</Text>;
}

beforeEach(() => {
  seen = [];
});

describe('useTheme', () => {
  it.each([
    ['light', colors.light],
    ['dark', colors.dark],
  ] as const)('suit le réglage système : %s', async (scheme, palette) => {
    mockScheme.mockReturnValue(scheme);
    await render(<Probe />);
    expect(seen.at(-1)?.theme.scheme).toBe(scheme);
    expect(seen.at(-1)?.theme.colors).toBe(palette);
  });

  it('retombe sur le clair quand le système ne dit rien', async () => {
    mockScheme.mockReturnValue(null);
    await render(<Probe />);
    expect(seen.at(-1)?.theme.scheme).toBe('light');
  });

  it('bascule quand le réglage système change, avec des références stables', async () => {
    mockScheme.mockReturnValue('light');
    const { rerender } = await render(<Probe />);
    await rerender(<Probe />);
    mockScheme.mockReturnValue('dark');
    await rerender(<Probe />);
    const [first, second, third] = seen;
    expect(second.theme).toBe(first.theme);
    expect(second.styles).toBe(first.styles);
    expect(third.theme.scheme).toBe('dark');
    expect(third.styles.card.backgroundColor).toBe(colors.dark.surface);
  });
});
