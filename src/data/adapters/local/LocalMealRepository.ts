import AsyncStorage from '@react-native-async-storage/async-storage';

import { MealSchema, type Meal } from '@/src/core/schemas';
import type { IMealRepository } from '@/src/data/repositories/IMealRepository';

const KEY = 'pf:meals';

export class LocalMealRepository implements IMealRepository {
  private async loadAll(): Promise<Meal[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((item) => {
      const r = MealSchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  }

  private async saveAll(meals: Meal[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(meals));
  }

  async listByDate(date: string): Promise<Meal[]> {
    const all = await this.loadAll();
    return all.filter((m) => m.loggedAt.startsWith(date));
  }

  async add(meal: Meal): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((m) => m.id === meal.id);
    if (idx >= 0) {
      all[idx] = meal;
    } else {
      all.push(meal);
    }
    await this.saveAll(all);
  }

  async remove(id: string): Promise<void> {
    const all = await this.loadAll();
    await this.saveAll(all.filter((m) => m.id !== id));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
