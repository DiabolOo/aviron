import AsyncStorage from '@react-native-async-storage/async-storage';

import { createRepositories } from './index';
import { seedLocalIfNeeded } from './seed';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('seedLocalIfNeeded', () => {
  it('seed depuis les mocks quand aucun legacy', async () => {
    const repos = createRepositories('local');
    await seedLocalIfNeeded(repos);

    const profile = await repos.profile.get();
    expect(profile?.firstName).toBe('Alex');
    expect((await repos.meals.listAll()).length).toBeGreaterThan(0);
    expect((await repos.workouts.listAll()).length).toBe(7);
    expect((await repos.recipes.list()).length).toBeGreaterThan(0);
    expect((await repos.activities.listRecent(10)).length).toBe(5);
    expect(await AsyncStorage.getItem('pf:seeded')).toBe('1');
  });

  it('seed depuis la sauvegarde legacy quand elle existe', async () => {
    const repos = createRepositories('local');
    await seedLocalIfNeeded(repos, {
      profile: {
        firstName: 'Julie',
        weightKg: 60,
        targetWeightKg: 58,
        goalLabel: 'Test',
        calorieTarget: 1900,
        macrosTarget: { calories: 1900, protein: 120, carbs: 200, fat: 60 },
      },
      meals: [
        {
          id: 'legacy-meal',
          name: 'Repas legacy',
          loggedAt: '2026-10-29T12:00:00',
          macros: { calories: 500, protein: 30, carbs: 50, fat: 15 },
          confidence: 1,
        },
      ],
    });

    expect((await repos.profile.get())?.firstName).toBe('Julie');
    const meals = await repos.meals.listAll();
    expect(meals).toHaveLength(1);
    expect(meals[0].id).toBe('legacy-meal');
  });

  it('est idempotent : un second appel ne réécrit pas', async () => {
    const repos = createRepositories('local');
    await seedLocalIfNeeded(repos);
    await repos.meals.clear();
    await seedLocalIfNeeded(repos);
    expect(await repos.meals.listAll()).toHaveLength(0);
  });

  it('ne fait rien pour l’adaptateur mock', async () => {
    const repos = createRepositories('mock');
    const before = await repos.meals.listAll();
    await seedLocalIfNeeded(repos);
    expect(await repos.meals.listAll()).toEqual(before);
    expect(await AsyncStorage.getItem('pf:seeded')).toBeNull();
  });
});
