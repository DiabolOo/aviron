import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ActivityHistory } from '@/components/sport/ActivityHistory';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { formatDayMonth } from '@/src/core/dates';
import { latestActivityDate, selectWeek, shiftWeek, weekStartISO } from '@/src/core/sportWeek';
import { useTheme } from '@/src/ui/useTheme';

export function SportDashboard() {
  const activities = usePulseFitStore((s) => s.activities);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);
  const goal = usePulseFitStore((s) => s.profile.athleticGoal);
  const { colors } = useTheme();
  const currentStart = weekStartISO();
  const [start, setStart] = useState(currentStart);

  const week = selectWeek(activities, start);
  const isCurrent = week.start === currentStart;
  const last = latestActivityDate(activities);
  const rangeLabel = isCurrent ? 'Cette semaine' : `${formatDayMonth(week.start)} – ${formatDayMonth(week.end)}`;

  return (
    <View>
      <View className="mt-8 flex-row items-center justify-between">
        <Pressable onPress={() => setStart(shiftWeek(week.start, -1))} hitSlop={12} className="p-2 active:opacity-70">
          <ChevronLeft color={colors.fg} size={20} strokeWidth={1.8} />
        </Pressable>
        <Label>{rangeLabel}</Label>
        <Pressable
          onPress={() => setStart(shiftWeek(week.start, 1))}
          disabled={isCurrent}
          hitSlop={12}
          className={`p-2 active:opacity-70 ${isCurrent ? 'opacity-30' : ''}`}>
          <ChevronRight color={colors.fg} size={20} strokeWidth={1.8} />
        </Pressable>
      </View>
      <View className="mt-2 items-center">
        {goal ? (
          <Text className="text-6xl font-semibold tracking-tighter text-fg">
            {week.count}
            <Text className="text-3xl text-muted">/{goal.weeklySessionsCount}</Text>
          </Text>
        ) : (
          <Text className="text-6xl font-semibold tracking-tighter text-fg">{week.count}</Text>
        )}
        <Label className="mt-1">
          {goal ? 'séances cette semaine' : `${week.count > 1 ? 'séances' : 'séance'} cette semaine`}
        </Label>
      </View>
      <ActivityHistory
        week={week}
        activities={activities}
        connected={stravaConnected}
        lastActivityLabel={last ? formatDayMonth(last) : undefined}
      />
    </View>
  );
}
