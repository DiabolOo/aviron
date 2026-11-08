import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

const useStyles = makeStyles((t) => ({
  close: { minHeight: t.size.touchMin, justifyContent: 'center' },
}));

/** Le profil est présenté en modale depuis l'avatar (ADR-012, amendement v3.4) : « Fermer » le referme. */
function CloseButton() {
  const styles = useStyles();
  const { opacity } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => [styles.close, pressed && { opacity: opacity.pressed }]}>
      <Text role="body" weight="semibold">Fermer</Text>
    </Pressable>
  );
}

export default function ProfileLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Profil',
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" options={{ title: 'Profil', headerRight: () => <CloseButton /> }} />
      <Stack.Screen name="modules" options={{ title: 'Modules' }} />
      <Stack.Screen name="[section]" options={{ title: 'Profil' }} />
    </Stack>
  );
}
