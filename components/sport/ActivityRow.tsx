import { router } from 'expo-router';
import { Activity, Bike, Dumbbell, Footprints, Mountain, Waves } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDayMonth } from '@/src/core/dates';
import { formatDuration } from '@/src/core/format';
import { activityPace, displayActivityName, formatKmNumber } from '@/src/core/sportFormat';
import type { ActivityType, StravaActivity } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

const ICONS: Record<ActivityType, typeof Footprints> = {
  run: Footprints,
  ride: Bike,
  walk: Mountain,
  swim: Waves,
  strength: Dumbbell,
  other: Activity,
};

export function ActivityRow({ activity, first }: { activity: StravaActivity; first: boolean }) {
  const { colors } = useTheme();
  const Icon = ICONS[activity.type];
  const effort = activityPace(
    activity.type,
    activity.distanceKm,
    (activity.movingTimeMin ?? activity.durationMin) * 60,
  );
  return (
    <Pressable
      onPress={() => router.push(`/activity/${activity.id}`)}
      className={`flex-row items-center gap-4 py-4 active:opacity-70 ${first ? '' : 'border-t border-fg/5'}`}>
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
}
