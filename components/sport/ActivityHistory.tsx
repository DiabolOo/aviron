import { router } from 'expo-router';
import { Bike, Footprints, Mountain, RefreshCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Label } from '@/components/ui/Label';
import { formatDayMonth } from '@/lib/dates';
import { formatDuration, formatPace, formatSpeed } from '@/lib/format';
import type { ActivityType, StravaActivity } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type ActivityHistoryProps = {
  activities: StravaActivity[];
  connected: boolean;
};

const ICONS: Record<ActivityType, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  walk: Mountain,
};

export function ActivityHistory({ activities, connected }: ActivityHistoryProps) {
  const { colors } = useTheme();
  const weekKm = activities
    .filter((a) => a.type === 'run')
    .reduce((sum, a) => sum + a.distanceKm, 0);

  return (
    <View className="mt-10">
      <View className="flex-row items-center justify-between">
        <Label>Activités Strava</Label>
        {connected ? (
          <Text className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
            {weekKm.toFixed(1)} km course
          </Text>
        ) : null}
      </View>

      {!connected ? (
        <Pressable
          onPress={() => router.navigate('/profil')}
          className="mt-3 rounded-3xl border border-dashed border-fg/15 p-5 active:opacity-70">
          <Text className="text-base font-semibold text-fg">Connecter Strava</Text>
          <Text className="mt-1 text-sm text-muted">Importe tes sorties depuis le Profil.</Text>
        </Pressable>
      ) : activities.length === 0 ? (
        <EmptyState
          className="mt-3"
          icon={RefreshCcw}
          title="Aucune activité Strava synchronisée"
          description="Tes sorties apparaîtront ici après la prochaine synchro."
        />
      ) : (
        <View className="mt-2">
          {activities.map((activity, index) => {
            const Icon = ICONS[activity.type];
            const pace =
              activity.type === 'ride'
                ? formatSpeed(activity.distanceKm, activity.movingTimeMin)
                : formatPace(activity.distanceKm, activity.movingTimeMin);
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
                    {activity.name}
                  </Text>
                  <Text className="mt-0.5 text-sm text-muted">
                    {formatDayMonth(activity.date)} · {formatDuration(activity.movingTimeMin)} · {pace}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-fg">
                  {activity.distanceKm.toFixed(1)}
                  <Text className="text-xs font-normal text-muted"> km</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
