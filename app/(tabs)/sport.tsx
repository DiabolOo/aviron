import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ActivityHistory } from '@/components/sport/ActivityHistory';
import { AdaptControls } from '@/components/sport/AdaptControls';
import { SessionDetail } from '@/components/sport/SessionDetail';
import { WeekStrip } from '@/components/sport/WeekStrip';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { toISODate, weekDates } from '@/lib/dates';
import { usePulseFitStore } from '@/lib/store';
import type { FatigueLevel, TimeBudget, WorkoutSession } from '@/lib/types';

export default function SportScreen() {
  const sessions = usePulseFitStore((s) => s.sessions);
  const goalLabel = usePulseFitStore((s) => s.profile.goalLabel);
  const activities = usePulseFitStore((s) => s.activities);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const adaptWeek = usePulseFitStore((s) => s.adaptWeek);
  const isAdapting = usePulseFitStore((s) => s.isAdapting);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [fatigue, setFatigue] = useState<FatigueLevel>('ok');
  const [timeBudget, setTimeBudget] = useState<TimeBudget>('60');

  const week = useMemo(() => {
    const dates = weekDates();
    return dates
      .map((date) => sessions.find((session) => session.date === date))
      .filter((session): session is WorkoutSession => Boolean(session));
  }, [sessions]);

  const done = week.filter((session) => session.completed).length;
  const selected = sessions.find((session) => session.date === selectedDate) ?? week[0];

  return (
    <Screen>
      <View className="mt-2 flex-row items-end justify-between">
        <View className="flex-1 pr-4">
          <Label>Programme en cours</Label>
          <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">Sport</Text>
          <Text className="mt-1 text-sm text-muted">{goalLabel}</Text>
        </View>
        <Text className="mb-1 text-base text-muted">
          <Text className="font-semibold text-fg">{done}</Text> / {week.length}
        </Text>
      </View>
      <WeekStrip
        sessions={week}
        selectedDate={selected?.date ?? selectedDate}
        onSelect={setSelectedDate}
      />
      {selected ? <SessionDetail session={selected} onComplete={completeSession} /> : null}
      <ActivityHistory activities={activities} connected={stravaConnected} />
      <AdaptControls
        fatigue={fatigue}
        timeBudget={timeBudget}
        isAdapting={isAdapting}
        onFatigue={setFatigue}
        onTime={setTimeBudget}
        onAdapt={() => void adaptWeek(fatigue, timeBudget)}
      />
    </Screen>
  );
}
