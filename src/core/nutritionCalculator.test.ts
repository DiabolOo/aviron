import { MOCK_PROFILE } from '@/src/data/mock';

import {
  MIN_DAILY_CALORIES,
  calculateMacros,
  calculateNutritionTargets,
} from './nutritionCalculator';
import type { ActivityLevel, NutritionGoal, Sex } from './types';

function macroKcalErrorRatio(m: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): number {
  const fromMacros = m.protein * 4 + m.carbs * 4 + m.fat * 9;
  return Math.abs(fromMacros - m.calories) / m.calories;
}

describe('invariant macros', () => {
  const sexes: Sex[] = ['male', 'female', 'other'];
  const weights = [45, 60, 74.5, 90, 120, 150];
  const ages = [18, 30, 55];
  const levels: ActivityLevel[] = ['sedentary', 'light', 'active', 'athlete'];
  const goals: NutritionGoal[] = ['weight_loss', 'maintenance', 'muscle_gain'];
  const paces: (number | undefined)[] = [undefined, 0.3, 0.7];

  it('P×4 + G×4 + L×9 = calories ±1 % sur une matrice de profils', () => {
    let checked = 0;
    let hitFloor = 0;
    for (const sex of sexes) {
      for (const weightKg of weights) {
        for (const ageYears of ages) {
          for (const activityLevel of levels) {
            for (const goal of goals) {
              for (const weeklyPaceKg of paces) {
                const targets = calculateNutritionTargets({
                  sex,
                  weightKg,
                  targetWeightKg: weightKg,
                  heightCm: 175,
                  ageYears,
                  activityLevel,
                  goal,
                  weeklyPaceKg,
                });
                expect(targets).not.toBeNull();
                if (!targets) continue;
                if (targets.calories === MIN_DAILY_CALORIES[sex]) hitFloor += 1;
                expect(macroKcalErrorRatio(targets)).toBeLessThanOrEqual(0.01);
                checked += 1;
              }
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(hitFloor).toBeGreaterThan(0);
  });

  it('calculateMacros respecte l’invariant au plancher calorique', () => {
    const macros = calculateMacros(120, 1200);
    expect(macroKcalErrorRatio({ calories: 1200, ...macros })).toBeLessThanOrEqual(0.01);
  });

  it('MOCK_PROFILE respecte l’invariant', () => {
    expect(macroKcalErrorRatio(MOCK_PROFILE.macrosTarget)).toBeLessThanOrEqual(0.01);
  });
});
