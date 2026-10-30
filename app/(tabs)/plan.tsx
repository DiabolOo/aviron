import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { ProgramTimeline } from '@/components/sport/ProgramTimeline';
import { ProgramWizard } from '@/components/sport/ProgramWizard';
import { SessionDetail } from '@/components/sport/SessionDetail';
import { WeekStrip } from '@/components/sport/WeekStrip';
import { Screen } from '@/components/ui/Screen';
import { TabHeader } from '@/components/ui/TabHeader';
import { TAB_ICONS } from '@/components/ui/tabIcons';
import { usePulseFitStore } from '@/lib/store';
import { toISODate, weekDates } from '@/src/core/dates';
import type { WorkoutSession } from '@/src/core/types';

export default function PlanScreen() {
  const sessions = usePulseFitStore((s) => s.sessions);
  const goalLabel = usePulseFitStore((s) => s.profile.goalLabel);
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const program = usePulseFitStore((s) => s.activeWorkoutProgram);
  const resetWorkoutProgram = usePulseFitStore((s) => s.resetWorkoutProgram);
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));

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
      <TabHeader
        icon={TAB_ICONS.plan}
        tint="aqua"
        eyebrow={program ? 'Programme en cours' : 'Nouveau programme'}
        title="Plan"
        subtitle={goalLabel}
        right={
          program && week.length > 0 ? (
            <Text className="text-base text-muted">
              <Text className="font-semibold text-aqua">{done}</Text> / {week.length}
            </Text>
          ) : null
        }
      />
      {!program ? (
        <ProgramWizard />
      ) : (
        <>
          <ProgramTimeline
            program={program}
            onEdit={() => resetWorkoutProgram(true)}
            onReset={() => resetWorkoutProgram()}
          />
          {week.length > 0 ? (
            <WeekStrip
              sessions={week}
              selectedDate={selected?.date ?? selectedDate}
              onSelect={setSelectedDate}
            />
          ) : null}
          {selected ? <SessionDetail session={selected} onComplete={completeSession} /> : null}
        </>
      )}
    </Screen>
  );
}
