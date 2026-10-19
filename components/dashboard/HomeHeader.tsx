import { Text, View } from 'react-native';

import { StatusPill } from '@/components/dashboard/StatusPill';
import { greetingForHour } from '@/lib/dates';
import type { Weather, WorkoutSession } from '@/lib/types';

type HomeHeaderProps = {
  firstName: string;
  streak: number;
  weather: Weather;
  session?: WorkoutSession;
};

export function HomeHeader({ firstName, streak, weather, session }: HomeHeaderProps) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View className="mb-6 mt-2 w-full items-center px-4">
      <Text className="text-center text-3xl font-bold tracking-tight text-fg">
        {greetingForHour(now.getHours())}, {firstName}
      </Text>
      <Text className="mt-0.5 text-center text-xs font-semibold uppercase tracking-wider text-fg/50">
        {dateLabel}
      </Text>
      <View className="mt-3">
        <StatusPill streak={streak} weather={weather} session={session} />
      </View>
    </View>
  );
}
