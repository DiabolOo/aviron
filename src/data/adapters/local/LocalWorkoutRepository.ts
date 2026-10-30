import AsyncStorage from '@react-native-async-storage/async-storage';

import { PlannedWorkoutSchema, type PlannedWorkout } from '@/src/core/schemas';
import type { IWorkoutRepository } from '@/src/data/repositories/IWorkoutRepository';

const KEY = 'pf:workouts';

export class LocalWorkoutRepository implements IWorkoutRepository {
  private async loadAll(): Promise<PlannedWorkout[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((item) => {
      const r = PlannedWorkoutSchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  }

  async listAll(): Promise<PlannedWorkout[]> {
    return this.loadAll();
  }

  async replaceAll(workouts: PlannedWorkout[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(workouts));
  }

  async upsert(workout: PlannedWorkout): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((w) => w.id === workout.id);
    if (idx >= 0) {
      all[idx] = workout;
    } else {
      all.push(workout);
    }
    await this.replaceAll(all);
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
