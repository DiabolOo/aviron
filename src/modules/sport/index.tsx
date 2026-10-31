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
  return <EnergyBatteryWidget />;
}

function Workout() {
  const { todaysSession } = useTodayStats();
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const uncompleteSession = usePulseFitStore((s) => s.uncompleteSession);
  return (
    <WorkoutWidget
      session={todaysSession}
      onComplete={completeSession}
      onUndo={uncompleteSession}
    />
  );
}

export const sportModule: LifeModule = {
  id: 'sport',
  title: 'Sport',
  enabledByDefault: true,
  entities: [PlannedWorkoutSchema, ActivitySchema, TrainingPlanSchema, GoalSchema],
  todayWidgets: [
    { id: 'workout', order: 10, Component: Workout },
    { id: 'energy', order: 30, Component: Energy, half: true },
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
