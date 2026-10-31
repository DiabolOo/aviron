import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ProgramTimeline } from '@/components/sport/ProgramTimeline';
import { NoPlanCard } from '@/components/sport/NoPlanCard';
import { SessionDetail } from '@/components/sport/SessionDetail';
import { WeekStrip } from '@/components/sport/WeekStrip';
import { usePulseFitStore } from '@/lib/store';
import { toISODate, weekDates } from '@/src/core/dates';
import type { WorkoutSession } from '@/src/core/types';

export function SportPlan() {
  const sessions = usePulseFitStore((s) => s.sessions);
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const program = usePulseFitStore((s) => s.activeWorkoutProgram);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

  const week = useMemo(() => {
    const dates = weekDates();
    return dates
      .map((date) => sessions.find((session) => session.date === date))
      .filter((session): session is WorkoutSession => Boolean(session));
  }, [sessions]);

  const selected = sessions.find((session) => session.date === selectedDate) ?? week[0];

  if (!program) return <NoPlanCard />;

  return (
    <View className="gap-3.5">
      <ProgramTimeline program={program} />
      {week.length > 0 ? (
        <WeekStrip
          sessions={week}
          selectedDate={selected?.date ?? selectedDate}
          onSelect={setSelectedDate}
        />
      ) : null}
      {selected ? <SessionDetail session={selected} onComplete={completeSession} /> : null}
    </View>
  );
}
