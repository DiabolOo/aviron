import { useColorScheme } from 'nativewind';

import { palettes, type Scheme } from '@/constants/theme';

export function useTheme() {
  const { colorScheme } = useColorScheme();
  const scheme: Scheme = colorScheme === 'dark' ? 'dark' : 'light';
  return { scheme, colors: palettes[scheme] };
}
