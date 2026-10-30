import AsyncStorage from '@react-native-async-storage/async-storage';

import { ActivitySchema, type Activity } from '@/src/core/schemas';
import type { IActivityRepository } from '@/src/data/repositories/IActivityRepository';

const KEY = 'pf:activities';

export class LocalActivityRepository implements IActivityRepository {
  private async loadAll(): Promise<Activity[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((item) => {
      const r = ActivitySchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  }

  private async saveAll(activities: Activity[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(activities));
  }

  async listRecent(n: number): Promise<Activity[]> {
    const all = await this.loadAll();
    return [...all].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
  }

  async listByDateRange(from: string, to: string): Promise<Activity[]> {
    const all = await this.loadAll();
    return all.filter((a) => a.date >= from && a.date <= to);
  }

  async add(activity: Activity): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      all[idx] = activity;
    } else {
      all.push(activity);
    }
    await this.saveAll(all);
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
