import { Moon, Sun } from 'lucide-react-native';

import { IconButton } from '@/components/ui/IconButton';
import { usePulseFitStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

export function ThemeToggle() {
  const { scheme, colors } = useTheme();
  const setThemePreference = usePulseFitStore((s) => s.setThemePreference);
  const Icon = scheme === 'dark' ? Sun : Moon;

  return (
    <IconButton
      label={scheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onPress={() => setThemePreference(scheme === 'dark' ? 'light' : 'dark')}>
      <Icon color={colors.fg} size={18} strokeWidth={1.8} />
    </IconButton>
  );
}
