import type { Meal } from '@/src/core/schemas';

export interface IMealRepository {
  listByDate(date: string): Promise<Meal[]>;
  add(meal: Meal): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
