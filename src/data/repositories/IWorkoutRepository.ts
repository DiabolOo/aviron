import type { PlannedWorkout } from '@/src/core/schemas';

export interface IWorkoutRepository {
  listAll(): Promise<PlannedWorkout[]>;
  replaceAll(workouts: PlannedWorkout[]): Promise<void>;
  upsert(workout: PlannedWorkout): Promise<void>;
  clear(): Promise<void>;
}
