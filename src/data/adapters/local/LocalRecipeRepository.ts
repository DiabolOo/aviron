import AsyncStorage from '@react-native-async-storage/async-storage';

import { RecipeSchema, type Recipe } from '@/src/core/schemas';
import type { IRecipeRepository } from '@/src/data/repositories/IRecipeRepository';

const KEY = 'pf:recipes';

export class LocalRecipeRepository implements IRecipeRepository {
  private async loadAll(): Promise<Recipe[]> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown[] = JSON.parse(raw);
    return arr.flatMap((item) => {
      const r = RecipeSchema.safeParse(item);
      return r.success ? [r.data] : [];
    });
  }

  private async saveAll(recipes: Recipe[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(recipes));
  }

  async list(): Promise<Recipe[]> {
    return this.loadAll();
  }

  async upsert(recipe: Recipe): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      all[idx] = recipe;
    } else {
      all.push(recipe);
    }
    await this.saveAll(all);
  }

  async remove(id: string): Promise<void> {
    const all = await this.loadAll();
    await this.saveAll(all.filter((r) => r.id !== id));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
