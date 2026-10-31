export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type PlannedMeal = { slot: MealSlot; label: string; name: string; kcal: number };

const SHARES: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.38, dinner: 0.32 };

const LABELS: Record<MealSlot, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
};

const CATALOG: Record<MealSlot, string[]> = {
  breakfast: ['Skyr, avoine, banane', 'Œufs, pain complet, fruit', 'Porridge, amandes, myrtilles', 'Fromage blanc, granola'],
  lunch: ['Poulet, riz, brocoli', 'Saumon, quinoa, courgettes', 'Bowl thon, avocat, riz', 'Dinde, patate douce, haricots'],
  dinner: ['Pâtes complètes au thon', 'Omelette, légumes rôtis', 'Lentilles, œuf, carottes', 'Cabillaud, riz, épinards'],
};

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

export function buildMealPlan(targetKcal: number, seed: number): PlannedMeal[][] {
  return Array.from({ length: 7 }, (_, day) =>
    MEAL_SLOTS.map((slot) => {
      const names = CATALOG[slot];
      return {
        slot,
        label: LABELS[slot],
        name: names[(day + seed * (MEAL_SLOTS.indexOf(slot) + 1)) % names.length],
        kcal: Math.round((targetKcal * SHARES[slot]) / 10) * 10,
      };
    }),
  );
}

export type DinnerIdea = { name: string; kcal: number; protein: number; minutes: number };

const DINNERS: DinnerIdea[] = [
  { name: 'Pâtes complètes au thon et courgettes', kcal: 740, protein: 42, minutes: 20 },
  { name: 'Omelette aux légumes rôtis', kcal: 520, protein: 32, minutes: 15 },
  { name: 'Cabillaud, riz et épinards', kcal: 640, protein: 45, minutes: 25 },
  { name: 'Lentilles, œuf et carottes', kcal: 600, protein: 30, minutes: 25 },
  { name: 'Bowl de poulet, riz et avocat', kcal: 820, protein: 48, minutes: 20 },
];

export function suggestDinner(remainingKcal: number, index = 0): DinnerIdea {
  const goal = Math.min(900, Math.max(400, remainingKcal));
  const sorted = [...DINNERS].sort((a, b) => Math.abs(a.kcal - goal) - Math.abs(b.kcal - goal));
  return sorted[((index % sorted.length) + sorted.length) % sorted.length];
}
