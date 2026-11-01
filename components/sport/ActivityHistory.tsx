import { router } from 'expo-router';
import { Activity, Bike, Dumbbell, Footprints, Mountain, RefreshCcw, Waves } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';

import { EmptyState } from '@/components/ui/EmptyState';
import { Label } from '@/components/ui/Label';
import { formatDayMonth } from '@/src/core/dates';
import { formatDuration } from '@/src/core/format';
import { activityPace, displayActivityName, formatKmNumber, formatKmTotal } from '@/src/core/sportFormat';
import type { ActivityType, StravaActivity } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

type ActivityHistoryProps = {
  activities: StravaActivity[];
  connected: boolean;
};

const ICONS: Record<ActivityType, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  walk: Mountain,
  swim: Waves,
  strength: Dumbbell,
  other: Activity,
};

export function ActivityHistory({ activities, connected }: ActivityHistoryProps) {
  const { colors } = useTheme();
  const weekKm = activities
    .filter((a) => a.type === 'run')
    .reduce((sum, a) => sum + (a.distanceKm ?? 0), 0);

  return (
    <View className="mt-10">
      <View className="flex-row items-center justify-between">
        <Label>Activités</Label>
        {connected ? (
          <Text className="font-mono text-[13px] text-muted">
            {formatKmTotal(weekKm)} course
          </Text>
        ) : null}
      </View>

      {!connected ? (
        <Pressable
          onPress={() => router.navigate('/profile-section?id=connexions')}
          className="mt-3 rounded-3xl border border-dashed border-fg/15 p-5 active:opacity-70">
          <Text className="text-base font-semibold text-fg">Connecter Strava</Text>
          <Text className="mt-1 text-sm text-muted">Importe tes sorties depuis ton profil.</Text>
        </Pressable>
      ) : activities.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={RefreshCcw}
          title="Aucune activité synchronisée"
          description="Tes sorties apparaîtront ici après la prochaine synchro."
        />
      ) : (
        <View className="mt-2">
          {activities.map((activity, index) => {
            const Icon = ICONS[activity.type];
            const effort = activityPace(
              activity.type,
              activity.distanceKm,
              (activity.movingTimeMin ?? activity.durationMin) * 60,
            );
            return (
              <Pressable
                key={activity.id}
                onPress={() => router.push(`/activity/${activity.id}`)}
                className={`flex-row items-center gap-4 py-4 active:opacity-70 ${index > 0 ? 'border-t border-fg/5' : ''}`}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-fg/5">
                  <Icon color={colors.fg} size={17} strokeWidth={1.8} />
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-base text-fg">
                    {displayActivityName(activity.name)}
                  </Text>
                  <Text className="mt-0.5 text-sm font-medium text-fg/70">
                    {formatDayMonth(activity.date)} · {formatDuration(activity.durationMin)}
                    {effort ? ` · ${effort.value} ${effort.unit}` : ''}
                  </Text>
                </View>
                {activity.distanceKm !== undefined && activity.distanceKm > 0 ? (
                  <Text className="text-base font-semibold text-fg">
                    {formatKmNumber(activity.distanceKm)}
                    <Text className="text-xs font-normal text-muted"> km</Text>
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
