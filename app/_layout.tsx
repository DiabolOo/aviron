import '../global.css';

import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';

import { usePulseFitStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

export {
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const themePreference = usePulseFitStore((s) => s.themePreference);
  const { scheme, colors } = useTheme();

  useEffect(() => {
    colorScheme.set(themePreference);
  }, [themePreference]);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.canvas,
        card: colors.canvas,
        text: colors.fg,
        border: 'transparent',
      },
    };
  }, [scheme, colors]);

  const hasCompletedOnboarding = usePulseFitStore((s) => s.hasCompletedOnboarding);
  const [hydrated, setHydrated] = useState(usePulseFitStore.persist.hasHydrated());

  useEffect(() => {
    return usePulseFitStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
          animation: 'fade',
        }}>
        <Stack.Protected guard={!hasCompletedOnboarding}>
          <Stack.Screen name="onboarding/index" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="scan"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="session/[id]"
            options={{
              headerShown: true,
              headerTitle: '',
              headerTintColor: colors.fg,
              headerStyle: { backgroundColor: colors.canvas },
              headerShadowVisible: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="activity/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
