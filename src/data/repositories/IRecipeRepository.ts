import type { Recipe } from '@/src/core/schemas';

export interface IRecipeRepository {
  list(): Promise<Recipe[]>;
  upsert(recipe: Recipe): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
