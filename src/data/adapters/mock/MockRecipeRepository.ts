import type { Recipe } from '@/src/core/schemas';
import { MOCK_RECIPES } from '@/src/data/mock';
import type { IRecipeRepository } from '@/src/data/repositories/IRecipeRepository';

export class MockRecipeRepository implements IRecipeRepository {
  private recipes: Recipe[] = [...MOCK_RECIPES] as Recipe[];

  async list(): Promise<Recipe[]> {
    return [...this.recipes];
  }

  async upsert(recipe: Recipe): Promise<void> {
    const idx = this.recipes.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      this.recipes[idx] = recipe;
    } else {
      this.recipes.push(recipe);
    }
  }

  async remove(id: string): Promise<void> {
    this.recipes = this.recipes.filter((r) => r.id !== id);
  }

  async clear(): Promise<void> {
    this.recipes = [];
  }
}
