import { MockActivityRepository } from '@/src/data/adapters/mock/MockActivityRepository';
import { MockMealRepository } from '@/src/data/adapters/mock/MockMealRepository';
import { MockProfileRepository } from '@/src/data/adapters/mock/MockProfileRepository';
import { MockProposalRepository } from '@/src/data/adapters/mock/MockProposalRepository';
import { MockRecipeRepository } from '@/src/data/adapters/mock/MockRecipeRepository';
import { MockWeatherRepository } from '@/src/data/adapters/mock/MockWeatherRepository';
import { MockWorkoutRepository } from '@/src/data/adapters/mock/MockWorkoutRepository';
import { LocalActivityRepository } from '@/src/data/adapters/local/LocalActivityRepository';
import { LocalMealRepository } from '@/src/data/adapters/local/LocalMealRepository';
import { LocalProfileRepository } from '@/src/data/adapters/local/LocalProfileRepository';
import { LocalProposalRepository } from '@/src/data/adapters/local/LocalProposalRepository';
import { LocalRecipeRepository } from '@/src/data/adapters/local/LocalRecipeRepository';
import { LocalWeatherRepository } from '@/src/data/adapters/local/LocalWeatherRepository';
import { LocalWorkoutRepository } from '@/src/data/adapters/local/LocalWorkoutRepository';
import { FixtureActivityRepository } from '@/src/data/adapters/fixture/FixtureActivityRepository';
import type { IActivityRepository } from '@/src/data/repositories/IActivityRepository';
import type { IMealRepository } from '@/src/data/repositories/IMealRepository';
import type { IProfileRepository } from '@/src/data/repositories/IProfileRepository';
import type { IProposalRepository } from '@/src/data/repositories/IProposalRepository';
import type { IRecipeRepository } from '@/src/data/repositories/IRecipeRepository';
import type { IWeatherRepository } from '@/src/data/repositories/IWeatherRepository';
import type { IWorkoutRepository } from '@/src/data/repositories/IWorkoutRepository';

export type AdapterKind = 'mock' | 'local' | 'fixture';

export type Repositories = {
  profile: IProfileRepository;
  meals: IMealRepository;
  activities: IActivityRepository;
  workouts: IWorkoutRepository;
  recipes: IRecipeRepository;
  weather: IWeatherRepository;
  proposals: IProposalRepository;
};

export function createRepositories(adapter: AdapterKind): Repositories {
  if (adapter === 'mock') {
    return {
      profile: new MockProfileRepository(),
      meals: new MockMealRepository(),
      activities: new MockActivityRepository(),
      workouts: new MockWorkoutRepository(),
      recipes: new MockRecipeRepository(),
      weather: new MockWeatherRepository(),
      proposals: new MockProposalRepository(),
    };
  }
  const activities =
    adapter === 'fixture' ? new FixtureActivityRepository() : new LocalActivityRepository();
  return {
    profile: new LocalProfileRepository(),
    meals: new LocalMealRepository(),
    activities,
    workouts: new LocalWorkoutRepository(),
    recipes: new LocalRecipeRepository(),
    weather: new LocalWeatherRepository(),
    proposals: new LocalProposalRepository(),
  };
}
