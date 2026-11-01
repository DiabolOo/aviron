import { router } from 'expo-router';
import { Activity, Bike, Dumbbell, Footprints, Mountain, Waves } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDayMonth } from '@/src/core/dates';
import { activityDurationDisplay, activityPace, effortTimeSec, displayActivityName, formatKmNumber } from '@/src/core/sportFormat';
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

type Props = { activity: StravaActivity; first: boolean; raceId?: string };

export function ActivityRow({ activity, first, raceId }: Props) {
  const { colors } = useTheme();
  const Icon = ICONS[activity.type];
  const effort = activityPace(
    activity.type,
    activity.distanceKm,
    effortTimeSec(activity),
  );
  return (
    <Pressable
      onPress={() => router.push(`/activity/${activity.id}`)}
      className={`flex-row items-center gap-4 py-4 active:opacity-70 ${first ? '' : 'border-t border-fg/5'}`}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-fg/5">
        <Icon color={colors.fg} size={17} strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="shrink text-base text-fg">
            {displayActivityName(activity.name)}
          </Text>
          {raceId ? (
            <Pressable
              hitSlop={6}
              onPress={() => router.push(`/race/${raceId}`)}
              className="rounded-full bg-fg px-2 py-0.5 active:opacity-70">
              <Text className="text-[11px] font-semibold text-canvas">Course</Text>
            </Pressable>
          ) : null}
        </View>
        <Text className="mt-0.5 text-sm font-medium text-fg/70">
          {formatDayMonth(activity.date)} · {activityDurationDisplay(activity, raceId !== undefined).main}
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
