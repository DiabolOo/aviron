import { Footprints } from 'lucide-react-native';

import { RaceInsightCards } from '@/components/race/RaceInsightCards';
import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { SportDashboard } from '@/src/modules/sport/SportDashboard';
import { SportPlan } from '@/src/modules/sport/SportPlan';
import { SportTrends } from '@/src/modules/sport/SportTrends';
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
    { id: 'race-insights', order: 15, Component: RaceInsightCards },
  ],
  plans: [{ id: 'sport-plan', title: 'Sport', Component: SportPlan }],
  dashboards: [{ id: 'sport', title: 'Sport', Component: SportDashboard }],
  trends: [{ id: 'sport-trends', title: 'Sport', Component: SportTrends }],
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
  agentExamples: ['Décale la sortie longue', 'Prépare un semi en 1h45 dans 10 semaines'],
  analyzers: [],
};
