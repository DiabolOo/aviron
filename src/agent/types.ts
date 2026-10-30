import type { FatigueLevel, Meal, TimeBudget, WorkoutSession } from '@/src/core/types';

export type AdaptWeekParams = {
  fatigue: FatigueLevel;
  timeBudget: TimeBudget;
  sessions: WorkoutSession[];
};

export interface IAgent {
  analyzePlate(photoUri: string): Promise<Meal>;
  adaptWeek(params: AdaptWeekParams): Promise<WorkoutSession[]>;
  generateDefaultWeek(): Promise<WorkoutSession[]>;
}
