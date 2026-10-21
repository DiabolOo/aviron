import {
    ACTIVITY_FACTORS,
    calculateBMR,
    calculateNutritionTargets,
    calculateTDEE,
    roundToNearest10,
} from '@/lib/nutritionCalculator';
import type {
    ActivityLevel,
    MainSport,
    NutritionGoal,
    Sex,
    UserProfile,
} from '@/lib/types';

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

export const GOAL_OPTIONS: readonly {
  id: NutritionGoal;
  label: string;
  description: string;
}[] = [
  {
    id: 'weight_loss',
    label: 'Perte de poids',
    description: 'Déficit calorique adapté à ton rythme',
  },
  {
    id: 'maintenance',
    label: 'Maintien',
    description: 'Équilibre entre apports et dépenses',
  },
  {
    id: 'muscle_gain',
    label: 'Prise de masse',
    description: 'Surplus calorique contrôlé',
  },
];

type BodyData = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
};

type OnboardingData = BodyData & {
  mainSport: MainSport;
  goal: NutritionGoal;
  targetWeightKg: number;
  weeklyPaceKg?: number;
};

export function computeCalorieTarget(data: BodyData): number {
  return roundToNearest10(
    calculateTDEE(calculateBMR(data), data.activityLevel),
  );
}

export function buildProfileFromOnboarding(
  firstName: string,
  data: OnboardingData,
): Partial<UserProfile> {
  const targets = calculateNutritionTargets(data);
  const calories = targets?.calories ?? computeCalorieTarget(data);
  const sportLabel = SPORT_OPTIONS.find((sport) => sport.id === data.mainSport)?.label;
  return {
    firstName,
    ...data,
    weeklyPaceKg: data.goal === 'maintenance' ? undefined : data.weeklyPaceKg,
    goalLabel: sportLabel ?? 'Remise en forme',
    calorieTarget: calories,
    macrosTarget: {
      calories,
      protein: targets?.protein ?? Math.round(data.weightKg * 2),
      carbs: targets?.carbs ?? Math.round((calories * 0.45) / 4),
      fat: targets?.fat ?? Math.round((calories * 0.25) / 9),
    },
  };
}
