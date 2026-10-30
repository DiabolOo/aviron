import { calculateMacros } from '@/src/core/nutritionCalculator';
import type { UserProfile } from '@/src/core/types';

export const DEFAULT_CALORIE_TARGET = 2000;

export const DEFAULT_PROFILE: UserProfile = {
  firstName: '',
  goalLabel: '',
  calorieTarget: DEFAULT_CALORIE_TARGET,
  macrosTarget: {
    calories: DEFAULT_CALORIE_TARGET,
    ...calculateMacros(70, DEFAULT_CALORIE_TARGET),
  },
  weightKg: 70,
  targetWeightKg: 70,
};
