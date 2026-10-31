import { Footprints } from 'lucide-react-native';

import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { SportDashboard } from '@/src/modules/sport/SportDashboard';
import { SportPlan } from '@/src/modules/sport/SportPlan';
import { SportStats } from '@/src/modules/sport/SportStats';
import {
  ActivitySchema,
  GoalSchema,
  PlannedWorkoutSchema,
  TrainingPlanSchema,
} from '@/src/core/schemas';
import type { LifeModule } from '@/src/modules/types';

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
  description: 'Plan, séances, charge',
  icon: Footprints,
  color: 'sport',
  enabledByDefault: true,
  entities: [PlannedWorkoutSchema, ActivitySchema, TrainingPlanSchema, GoalSchema],
  todayWidgets: [
    { id: 'workout', order: 10, Component: Workout },
  ],
  plans: [{ id: 'sport-plan', title: 'Sport', Component: SportPlan }],
  dashboards: [{ id: 'sport', title: 'Sport', Component: SportDashboard }],
  stats: [{ id: 'sport-stats', title: 'Sport', Component: SportStats }],
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
