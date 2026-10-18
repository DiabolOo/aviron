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
  { id: 'sedentary', label: 'Sédentaire', description: 'Peu ou pas de sport', factor: 1.2 },
  { id: 'light', label: 'Légèrement actif', description: '1 à 3 séances par semaine', factor: 1.375 },
  { id: 'active', label: 'Très actif', description: '4 à 6 séances par semaine', factor: 1.55 },
  { id: 'athlete', label: 'Athlète', description: 'Entraînement quotidien intense', factor: 1.725 },
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

export function computeCalorieTarget({
  sex,
  ageYears,
  heightCm,
  weightKg,
  activityLevel,
}: BodyData): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmr = sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : base - 78;
  const factor = ACTIVITY_LEVELS.find((level) => level.id === activityLevel)?.factor ?? 1.2;
  return Math.round((bmr * factor) / 10) * 10;
}

export function buildProfileFromOnboarding(
  firstName: string,
  data: OnboardingData,
): Partial<UserProfile> {
  const calories = computeCalorieTarget(data);
  return {
    firstName,
    ...data,
    targetWeightKg: data.weightKg,
    calorieTarget: calories,
    macrosTarget: {
      calories,
      protein: Math.round(data.weightKg * 2),
      carbs: Math.round((calories * 0.45) / 4),
      fat: Math.round((calories * 0.25) / 9),
    },
  };
}
