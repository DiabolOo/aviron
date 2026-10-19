import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { Weather, WeatherCondition, WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type StatusPillProps = {
  streak: number;
  weather: Weather;
  session?: WorkoutSession;
};

const WEATHER_ICONS: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
};

function shortStatus(session?: WorkoutSession): string {
  if (!session || session.kind === 'rest') return 'Repos 🔋';
  if (session.completed) return 'Séance pliée ! 🎉';
  return 'À toi de jouer ! 🚀';
}

export function StatusPill({ streak, weather, session }: StatusPillProps) {
  const { colors } = useTheme();
  const WeatherIcon = WEATHER_ICONS[weather.condition];

  return (
    <View className="flex-row items-center justify-center gap-2 rounded-full border border-fg/10 bg-surface/70 px-4 py-2 shadow-sm">
      <Text
        accessibilityLabel={`Série de ${streak} jours`}
        className="text-xs font-semibold text-fg">
        🔥 {streak} {streak > 1 ? 'jours' : 'jour'}
      </Text>
      <View
        accessibilityLabel={`Météo ${weather.city}, ${weather.tempC} degrés`}
        className="flex-row items-center gap-1">
        <WeatherIcon color={colors.aqua} size={13} strokeWidth={1.9} />
        <Text className="text-xs text-fg">
          {weather.tempC}°<Text className="text-muted"> · {weather.city}</Text>
        </Text>
      </View>
      <View className="mx-1 h-3 w-[1px] bg-fg/15" />
      <Text className="text-xs font-semibold text-fg/80">{shortStatus(session)}</Text>
    </View>
  );
}
