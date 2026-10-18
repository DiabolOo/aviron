import { router } from 'expo-router';
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { greetingForHour } from '@/lib/dates';
import type { Weather, WeatherCondition } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type HomeHeaderProps = {
  firstName: string;
  streak: number;
  weather: Weather;
};

const WEATHER_ICONS: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
};

export function HomeHeader({ firstName, streak, weather }: HomeHeaderProps) {
  const { colors } = useTheme();
  const now = new Date();
  const WeatherIcon = WEATHER_ICONS[weather.condition];
  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View className="mt-2 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Label>{dateLabel}</Label>
        <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">
          {greetingForHour(now.getHours())}, {firstName}
        </Text>
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <View
            accessibilityLabel={`Série de ${streak} jours`}
            className="flex-row items-center rounded-full bg-accent px-3 py-1">
            <Text className="text-sm font-semibold text-accent-fg">
              🔥 {streak} {streak > 1 ? 'jours' : 'jour'}
            </Text>
          </View>
          <View
            accessibilityLabel={`Météo ${weather.city}, ${weather.tempC} degrés`}
            className="flex-row items-center gap-1.5 rounded-full border border-fg/10 bg-surface px-3 py-1">
            <WeatherIcon color={colors.aqua} size={14} strokeWidth={1.9} />
            <Text className="text-sm text-fg">
              {weather.tempC}°<Text className="text-muted"> · {weather.city}</Text>
            </Text>
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le profil"
        onPress={() => router.navigate('/profil')}
        className="h-11 w-11 items-center justify-center rounded-full bg-fg active:opacity-70">
        <Text className="text-base font-semibold text-canvas">
          {firstName.charAt(0).toUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
}
