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

export const KCAL_PER_KG_BODY_WEIGHT = 7700;
export const MIN_DAILY_CALORIES: Record<Sex, number> = {
  female: 1200,
  male: 1500,
  other: 1350,
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

export function paceToDailyKcalDelta(paceKgPerWeek: number): number {
  return (paceKgPerWeek * KCAL_PER_KG_BODY_WEIGHT) / 7;
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
    | 'weightKg'
    | 'targetWeightKg'
    | 'weeklyPaceKg'
    | 'sex'
    | 'ageYears'
    | 'heightCm'
    | 'activityLevel'
    | 'goal'
  >,
): NutritionTargets | null {
  const { sex, ageYears, heightCm, weightKg, activityLevel } = profile;
  if (!sex || ageYears == null || heightCm == null || !activityLevel) return null;

  const goal = profile.goal ?? inferGoal(weightKg, profile.targetWeightKg);
  const tdee = calculateTDEE(
    calculateBMR({ sex, weightKg, heightCm, ageYears }),
    activityLevel,
  );
  const adjusted =
    profile.weeklyPaceKg != null && goal !== 'maintenance'
      ? tdee +
        paceToDailyKcalDelta(profile.weeklyPaceKg) * (goal === 'weight_loss' ? -1 : 1)
      : adjustForGoal(tdee, goal);
  const calories = Math.max(roundToNearest10(adjusted), MIN_DAILY_CALORIES[sex]);
  return { calories, ...calculateMacros(weightKg, calories) };
}
