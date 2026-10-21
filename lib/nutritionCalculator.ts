import type { ActivityLevel, NutritionGoal, Sex, UserProfile } from '@/lib/types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  athlete: 1.725,
};

export const GOAL_ADJUSTMENTS: Record<NutritionGoal, number> = {
  weight_loss: 0.85,
  maintenance: 1,
  muscle_gain: 1.1,
};

export const PROTEIN_G_PER_KG = 2;
export const FAT_G_PER_KG = 1;
const PROTEIN_KCAL_PER_G = 4;
const CARBS_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

const WEIGHT_DELTA_TOLERANCE_KG = 0.5;

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type BmrInput = {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
};

export function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

export function calculateBMR({ sex, weightKg, heightCm, ageYears }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === 'female') return base - 161;
  if (sex === 'other') return base - 78;
  return base + 5;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export function adjustForGoal(tdee: number, goal: NutritionGoal): number {
  return tdee * GOAL_ADJUSTMENTS[goal];
}

export function inferGoal(weightKg: number, targetWeightKg: number): NutritionGoal {
  const diff = weightKg - targetWeightKg;
  if (diff > WEIGHT_DELTA_TOLERANCE_KG) return 'weight_loss';
  if (diff < -WEIGHT_DELTA_TOLERANCE_KG) return 'muscle_gain';
  return 'maintenance';
}

export function calculateMacros(
  weightKg: number,
  calories: number,
): Omit<NutritionTargets, 'calories'> {
  const protein = Math.round(weightKg * PROTEIN_G_PER_KG);
  const fat = Math.round(weightKg * FAT_G_PER_KG);
  const carbs = Math.max(
    0,
    Math.round(
      (calories - protein * PROTEIN_KCAL_PER_G - fat * FAT_KCAL_PER_G) / CARBS_KCAL_PER_G,
    ),
  );
  return { protein, carbs, fat };
}

export function calculateNutritionTargets(
  profile: Pick<
    UserProfile,
    'weightKg' | 'targetWeightKg' | 'sex' | 'ageYears' | 'heightCm' | 'activityLevel' | 'goal'
  >,
): NutritionTargets | null {
  const { sex, ageYears, heightCm, weightKg, activityLevel } = profile;
  if (!sex || ageYears == null || heightCm == null || !activityLevel) return null;

  const goal = profile.goal ?? inferGoal(weightKg, profile.targetWeightKg);
  const calories = roundToNearest10(
    adjustForGoal(
      calculateTDEE(calculateBMR({ sex, weightKg, heightCm, ageYears }), activityLevel),
      goal,
    ),
  );
  return { calories, ...calculateMacros(weightKg, calories) };
}
