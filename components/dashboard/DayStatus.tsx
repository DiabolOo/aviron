import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { Weather, WeatherCondition, WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type DayStatusProps = {
  weather: Weather;
  session?: WorkoutSession;
};

const WEATHER: Record<WeatherCondition, { label: string; icon: typeof Sun }> = {
  sunny: { label: 'Ensoleillé', icon: Sun },
  partly: { label: 'Éclaircies', icon: CloudSun },
  cloudy: { label: 'Nuageux', icon: Cloud },
  rain: { label: 'Pluie', icon: CloudRain },
};

function statusLabel(session?: WorkoutSession): string {
  if (!session || session.kind === 'rest') return 'Jour de récup';
  if (session.completed) return 'Séance faite';
  return 'Jour de séance';
}

export function DayStatus({ weather, session }: DayStatusProps) {
  const { colors } = useTheme();
  const meta = WEATHER[weather.condition];
  const WeatherIcon = meta.icon;
  const done = session?.completed ?? false;

  return (
    <View className="mt-6 flex-row items-center gap-3">
      <View className="flex-row items-center gap-2">
        <WeatherIcon color={colors.fg} size={16} strokeWidth={1.8} />
        <Text className="text-sm text-fg">
          {weather.tempC}°<Text className="text-muted"> · {meta.label}</Text>
        </Text>
      </View>
      <View className="h-1 w-1 rounded-full bg-fg/20" />
      <View className="flex-row items-center gap-2">
        <View className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-accent' : 'bg-fg/40'}`} />
        <Text className="text-sm text-muted">{statusLabel(session)}</Text>
      </View>
    </View>
  );
}
