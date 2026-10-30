import type { Meal } from '@/src/core/schemas';
import { MOCK_MEALS } from '@/src/data/mock';
import type { IMealRepository } from '@/src/data/repositories/IMealRepository';

export class MockMealRepository implements IMealRepository {
  private meals: Meal[] = [...MOCK_MEALS] as Meal[];

  async listByDate(date: string): Promise<Meal[]> {
    return this.meals.filter((m) => m.loggedAt.startsWith(date));
  }

  async add(meal: Meal): Promise<void> {
    this.meals.push(meal);
  }

  async remove(id: string): Promise<void> {
    this.meals = this.meals.filter((m) => m.id !== id);
  }

  async clear(): Promise<void> {
    this.meals = [];
  }
}
