import { buildMealPlan, suggestDinner } from './mealPlan';

describe('buildMealPlan', () => {
  it('produit 7 jours de 3 repas sous la cible', () => {
    const plan = buildMealPlan(2800, 0);
    expect(plan).toHaveLength(7);
    for (const day of plan) {
      expect(day).toHaveLength(3);
      expect(day.reduce((s, m) => s + m.kcal, 0)).toBeLessThanOrEqual(2800);
    }
  });

  it('change les plats quand la graine change', () => {
    expect(buildMealPlan(2800, 0)[0][1].name).not.toBe(buildMealPlan(2800, 1)[0][1].name);
  });
});

describe('suggestDinner', () => {
  it('choisit le plat le plus proche des kcal restantes', () => {
    expect(suggestDinner(850).kcal).toBe(820);
    expect(suggestDinner(100).kcal).toBe(520);
  });

  it('« Autre idée » parcourt les propositions', () => {
    expect(suggestDinner(850, 1).name).not.toBe(suggestDinner(850, 0).name);
  });
});
