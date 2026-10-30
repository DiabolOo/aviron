import type { PlannedWorkout } from '@/src/core/schemas';
import { sessionToPlanned } from '@/src/data/mappers';
import { buildWeekSessions } from '@/src/data/mock';
import type { IWorkoutRepository } from '@/src/data/repositories/IWorkoutRepository';

export class MockWorkoutRepository implements IWorkoutRepository {
  private workouts: PlannedWorkout[] = buildWeekSessions().map(sessionToPlanned);

  async listAll(): Promise<PlannedWorkout[]> {
    return [...this.workouts];
  }

  async replaceAll(workouts: PlannedWorkout[]): Promise<void> {
    this.workouts = [...workouts];
  }

  async upsert(workout: PlannedWorkout): Promise<void> {
    const idx = this.workouts.findIndex((w) => w.id === workout.id);
    if (idx >= 0) {
      this.workouts[idx] = workout;
    } else {
      this.workouts.push(workout);
    }
  }

  async clear(): Promise<void> {
    this.workouts = [];
  }
}
