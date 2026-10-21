import {
    ACTIVITY_FACTORS,
    calculateBMR,
    calculateNutritionTargets,
    calculateTDEE,
    roundToNearest10,
} from '@/lib/nutritionCalculator';
import type { ActivityLevel, MainSport, Sex, UserProfile } from '@/lib/types';

export const SPORT_OPTIONS: readonly { id: MainSport; label: string; emoji: string }[] = [
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'strength', label: 'Musculation', emoji: '🏋️' },
  { id: 'cycling', label: 'Cyclisme', emoji: '🚴' },
  { id: 'triathlon', label: 'Triathlon', emoji: '🏊' },
  { id: 'fitness', label: 'Remise en forme', emoji: '🧘' },
];

export const ACTIVITY_LEVELS: readonly {
  id: ActivityLevel;
  label: string;
  description: string;
  factor: number;
}[] = [
  {
    id: 'sedentary',
    label: 'Sédentaire',
    description: 'Peu ou pas de sport',
    factor: ACTIVITY_FACTORS.sedentary,
  },
  {
    id: 'light',
    label: 'Légèrement actif',
    description: '1 à 3 séances par semaine',
    factor: ACTIVITY_FACTORS.light,
  },
  {
    id: 'active',
    label: 'Très actif',
    description: '4 à 6 séances par semaine',
    factor: ACTIVITY_FACTORS.active,
  },
  {
    id: 'athlete',
    label: 'Athlète',
    description: 'Entraînement quotidien intense',
    factor: ACTIVITY_FACTORS.athlete,
  },
];

export const SEX_OPTIONS: readonly { id: Sex; label: string }[] = [
  { id: 'male', label: 'Homme' },
  { id: 'female', label: 'Femme' },
  { id: 'other', label: 'Autre' },
];

type BodyData = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
};

type OnboardingData = BodyData & { mainSport: MainSport };

export function computeCalorieTarget(data: BodyData): number {
  return roundToNearest10(
    calculateTDEE(calculateBMR(data), data.activityLevel),
  );
}

export function buildProfileFromOnboarding(
  firstName: string,
  data: OnboardingData,
): Partial<UserProfile> {
  const targets = calculateNutritionTargets({
    ...data,
    targetWeightKg: data.weightKg,
  });
  const calories = targets?.calories ?? computeCalorieTarget(data);
  return {
    firstName,
    ...data,
    targetWeightKg: data.weightKg,
    calorieTarget: calories,
    macrosTarget: {
      calories,
      protein: targets?.protein ?? Math.round(data.weightKg * 2),
      carbs: targets?.carbs ?? Math.round((calories * 0.45) / 4),
      fat: targets?.fat ?? Math.round((calories * 0.25) / 9),
    },
  };
}
