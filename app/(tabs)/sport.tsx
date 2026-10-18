import { CalendarOff, Sparkles, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text } from 'react-native';

import { ActivityHistory } from '@/components/sport/ActivityHistory';
import { AdaptControls } from '@/components/sport/AdaptControls';
import { SessionDetail } from '@/components/sport/SessionDetail';
import { WeekStrip } from '@/components/sport/WeekStrip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { TabHeader } from '@/components/ui/TabHeader';
import { toISODate, weekDates } from '@/lib/dates';
import { usePulseFitStore } from '@/lib/store';
import type { FatigueLevel, TimeBudget, WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

export default function SportScreen() {
  const sessions = usePulseFitStore((s) => s.sessions);
  const goalLabel = usePulseFitStore((s) => s.profile.goalLabel);
  const activities = usePulseFitStore((s) => s.activities);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const resetWeek = usePulseFitStore((s) => s.resetWeek);
  const adaptWeek = usePulseFitStore((s) => s.adaptWeek);
  const isAdapting = usePulseFitStore((s) => s.isAdapting);
  const { colors } = useTheme();
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
      <TabHeader
        icon={Zap}
        tint="aqua"
        eyebrow="Programme en cours"
        title="Sport"
        subtitle={goalLabel}
        right={
          week.length > 0 ? (
            <Text className="text-base text-muted">
              <Text className="font-semibold text-aqua">{done}</Text> / {week.length}
            </Text>
          ) : null
        }
      />
      {week.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={CalendarOff}
          title="Aucun programme actif"
          description="Choisis un plan d'entraînement pour lancer ta semaine."
          action={{
            label: 'Générer un plan',
            onPress: resetWeek,
            variant: 'primary',
            icon: <Sparkles color={colors.accentFg} size={16} strokeWidth={2} />,
          }}
        />
      ) : (
        <>
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
        </>
      )}
      <ActivityHistory activities={activities} connected={stravaConnected} />
    </Screen>
  );
}
