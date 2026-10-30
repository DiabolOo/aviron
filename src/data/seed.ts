import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Meal, Profile, Recipe } from '@/src/core/schemas';
import type { WorkoutSession } from '@/src/core/types';
import { LocalProfileRepository } from '@/src/data/adapters/local/LocalProfileRepository';
import type { Repositories } from '@/src/data/index';
import { sessionToPlanned, stravaToActivity } from '@/src/data/mappers';
import {
  MOCK_MEALS,
  MOCK_PROFILE,
  MOCK_RECIPES,
  buildStravaActivities,
  buildWeekSessions,
} from '@/src/data/mock';

const SEEDED_KEY = 'pf:seeded';

export type LegacySnapshot = {
  profile?: Profile;
  meals?: Meal[];
  sessions?: WorkoutSession[];
  savedRecipes?: Recipe[];
};

export async function seedLocalIfNeeded(
  repos: Repositories,
  legacy?: LegacySnapshot,
): Promise<void> {
  if (!(repos.profile instanceof LocalProfileRepository)) return;
  const already = await AsyncStorage.getItem(SEEDED_KEY);
  if (already) return;

  await repos.profile.save(legacy?.profile ?? MOCK_PROFILE);
  for (const meal of legacy?.meals ?? MOCK_MEALS) {
    await repos.meals.upsert(meal);
  }
  await repos.workouts.replaceAll(
    (legacy?.sessions ?? buildWeekSessions()).map(sessionToPlanned),
  );
  for (const recipe of legacy?.savedRecipes ?? MOCK_RECIPES) {
    await repos.recipes.upsert(recipe);
  }
  for (const activity of buildStravaActivities().map(stravaToActivity)) {
    await repos.activities.add(activity);
  }

  await AsyncStorage.setItem(SEEDED_KEY, '1');
}
