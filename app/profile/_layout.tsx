import { Stack } from 'expo-router';

import { useTheme } from '@/src/design';

export default function ProfileLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Retour',
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" options={{ title: 'Profil', headerBackTitle: 'Aujourd’hui' }} />
      <Stack.Screen name="modules" options={{ title: 'Modules', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="[section]" options={{ title: 'Profil', headerBackTitle: 'Profil' }} />
    </Stack>
  );
}
