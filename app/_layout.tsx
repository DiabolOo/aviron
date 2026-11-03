import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import { designFonts } from '@/src/design/fonts';
import { useTheme } from '@/src/ui/useTheme';

export {
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Polices des écrans antérieurs à la v3.1 : à retirer avec la dernière exception de eslint-rules/legacy-exceptions.js.
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...designFonts,
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
  const dataReady = usePulseFitStore((s) => s.dataReady);
  const [hydrated, setHydrated] = useState(usePulseFitStore.persist.hasHydrated());

  useEffect(() => {
    return usePulseFitStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated && !dataReady) {
      void usePulseFitStore.getState().hydrate();
    }
  }, [hydrated, dataReady]);

  useEffect(() => {
    if (dataReady) {
      void useProposalStore.getState().load();
    }
  }, [dataReady]);

  const ready = (fontsLoaded || fontError !== null) && hydrated && dataReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen name="gallery" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="activities" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="race/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="activity/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
