import type { Activity } from '@/src/core/schemas';
import { stravaToActivity } from '@/src/data/mappers';
import { buildStravaActivities } from '@/src/data/mock';
import type { IActivityRepository } from '@/src/data/repositories/IActivityRepository';

export class MockActivityRepository implements IActivityRepository {
  private activities: Activity[] = buildStravaActivities().map(stravaToActivity);

  async listAll(): Promise<Activity[]> {
    return [...this.activities].sort((a, b) => b.date.localeCompare(a.date));
  }

  async listRecent(n: number): Promise<Activity[]> {
    return (await this.listAll()).slice(0, n);
  }

  async listByDateRange(from: string, to: string): Promise<Activity[]> {
    return this.activities.filter((a) => a.date >= from && a.date <= to);
  }

  async add(activity: Activity): Promise<void> {
    const idx = this.activities.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      this.activities[idx] = activity;
    } else {
      this.activities.push(activity);
    }
  }

  async clear(): Promise<void> {
    this.activities = [];
  }
}
