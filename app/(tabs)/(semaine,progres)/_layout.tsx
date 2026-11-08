import { Stack } from 'expo-router';

import { useTheme } from '@/src/design';

/** Pile de l'onglet Semaine et de l'onglet Progrès : le détail et le débrief s'y empilent, barre d'onglets visible. */
export const unstable_settings = {
  semaine: { anchor: 'semaine' },
  progres: { anchor: 'progres' },
};

export default function TabStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
