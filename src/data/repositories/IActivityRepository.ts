import type { Activity } from '@/src/core/schemas';

export interface IActivityRepository {
  listAll(): Promise<Activity[]>;
  listRecent(n: number): Promise<Activity[]>;
  listByDateRange(from: string, to: string): Promise<Activity[]>;
  add(activity: Activity): Promise<void>;
  clear(): Promise<void>;
}
