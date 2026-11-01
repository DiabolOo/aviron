import { Pressable, View } from 'react-native';

import { SPORT_ICONS } from '@/components/sport/sportIcons';
import { Text } from '@/components/ui/Text';
import { formatDayMonth } from '@/src/core/dates';
import { activityDurationDisplay, activityPace, effortTimeSec, displayActivityName, formatKmNumber } from '@/src/core/sportFormat';
import type { StravaActivity } from '@/src/core/types';
import { openActivity, openRace } from '@/src/ui/nav';
import { sportTokens } from '@/src/ui/theme/sportColors';
import { useTheme } from '@/src/ui/useTheme';

type Props = { activity: StravaActivity; first: boolean; raceId?: string };

export function ActivityRow({ activity, first, raceId }: Props) {
  const { colors } = useTheme();
  const Icon = SPORT_ICONS[activity.type];
  const sport = sportTokens(colors, activity.type);
  const effort = activityPace(
    activity.type,
    activity.distanceKm,
    effortTimeSec(activity),
  );
  return (
    <Pressable
      onPress={() => openActivity(activity.id)}
      className={`flex-row items-center gap-4 py-4 active:opacity-70 ${first ? '' : 'border-t border-fg/5'}`}>
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: sport.tint }}>
        <Icon color={sport.color} size={18} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="shrink text-base text-fg">
            {displayActivityName(activity.name)}
          </Text>
          {raceId ? (
            <Pressable
              hitSlop={6}
              onPress={() => openRace(raceId)}
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
