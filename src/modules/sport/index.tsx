import { EnergyBatteryWidget } from '@/components/dashboard/EnergyBatteryWidget';
import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { SportDashboard } from '@/src/modules/sport/SportDashboard';
import {
  ActivitySchema,
  GoalSchema,
  PlannedWorkoutSchema,
  TrainingPlanSchema,
} from '@/src/core/schemas';
import type { LifeModule } from '@/src/modules/types';

function Energy() {
  const { todaysSession, consumed, profile } = useTodayStats();
  return (
    <EnergyBatteryWidget
      session={todaysSession}
      consumedKcal={consumed.calories}
      targetKcal={profile.macrosTarget.calories}
    />
  );
}

function Workout() {
  const { todaysSession } = useTodayStats();
  const completeSession = usePulseFitStore((s) => s.completeSession);
  return <WorkoutWidget session={todaysSession} onComplete={completeSession} />;
}

export const sportModule: LifeModule = {
  id: 'sport',
  title: 'Sport',
  enabledByDefault: true,
  entities: [PlannedWorkoutSchema, ActivitySchema, TrainingPlanSchema, GoalSchema],
  todayWidgets: [
    { id: 'workout', order: 20, Component: Workout },
    { id: 'energy', order: 40, Component: Energy },
  ],
  dashboards: [{ id: 'sport', title: 'Sport', Component: SportDashboard }],
  agentTools: [
    {
      name: 'get_recent_activities',
      description: 'Activités sportives récentes résumées',
      access: 'read',
    },
    {
      name: 'adjust_plan',
      description: 'Ajuster les séances planifiées',
      access: 'write',
    },
  ],
  analyzers: [],
};
