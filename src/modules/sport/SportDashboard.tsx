import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

import { ActivityHistory } from '@/components/sport/ActivityHistory';
import { Label } from '@/components/ui/Label';
import { usePulseFitStore } from '@/lib/store';
import { weekDates } from '@/src/core/dates';

export function SportDashboard() {
  const sessions = usePulseFitStore((s) => s.sessions);
  const activities = usePulseFitStore((s) => s.activities);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);

  const dates = weekDates();
  const week = sessions.filter((session) => dates.includes(session.date));
  const done = week.filter((session) => session.completed).length;

  return (
    <View>
      <View className="mt-8 items-center">
        <Text className="text-6xl font-semibold tracking-tighter text-fg">
          {done}
          <Text className="text-3xl text-muted">/{week.length}</Text>
        </Text>
        <Label className="mt-1">séances cette semaine</Label>
      </View>
      <ActivityHistory activities={activities} connected={stravaConnected} />
    </View>
  );
}
