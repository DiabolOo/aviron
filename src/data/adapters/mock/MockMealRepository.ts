import type { Meal } from '@/src/core/schemas';
import { MOCK_MEALS } from '@/src/data/mock';
import type { IMealRepository } from '@/src/data/repositories/IMealRepository';

export class MockMealRepository implements IMealRepository {
  private meals: Meal[] = [...MOCK_MEALS] as Meal[];

  async listByDate(date: string): Promise<Meal[]> {
    return this.meals.filter((m) => m.loggedAt.startsWith(date));
  }

  async listAll(): Promise<Meal[]> {
    return [...this.meals];
  }

  async add(meal: Meal): Promise<void> {
    await this.upsert(meal);
  }

  async upsert(meal: Meal): Promise<void> {
    const idx = this.meals.findIndex((m) => m.id === meal.id);
    if (idx >= 0) {
      this.meals[idx] = meal;
    } else {
      this.meals.push(meal);
    }
  }

  async remove(id: string): Promise<void> {
    this.meals = this.meals.filter((m) => m.id !== id);
  }

  async clear(): Promise<void> {
    this.meals = [];
  }
}
