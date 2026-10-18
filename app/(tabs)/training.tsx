import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AdaptControls } from '@/components/training/AdaptControls';
import { SessionDetail } from '@/components/training/SessionDetail';
import { WeekStrip } from '@/components/training/WeekStrip';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { toISODate, weekDates } from '@/lib/dates';
import { usePulseFitStore } from '@/lib/store';
import type { FatigueLevel, TimeBudget, WorkoutSession } from '@/lib/types';

export default function TrainingScreen() {
  const sessions = usePulseFitStore((s) => s.sessions);
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
        <View>
          <Label>Cette semaine</Label>
          <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">Entraînement</Text>
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
