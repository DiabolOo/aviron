import { MockActivityRepository } from '@/src/data/adapters/mock/MockActivityRepository';
import { MockMealRepository } from '@/src/data/adapters/mock/MockMealRepository';
import { MockProfileRepository } from '@/src/data/adapters/mock/MockProfileRepository';
import { MockProposalRepository } from '@/src/data/adapters/mock/MockProposalRepository';
import { LocalActivityRepository } from '@/src/data/adapters/local/LocalActivityRepository';
import { LocalMealRepository } from '@/src/data/adapters/local/LocalMealRepository';
import { LocalProfileRepository } from '@/src/data/adapters/local/LocalProfileRepository';
import { LocalProposalRepository } from '@/src/data/adapters/local/LocalProposalRepository';
import type { IActivityRepository } from '@/src/data/repositories/IActivityRepository';
import type { IMealRepository } from '@/src/data/repositories/IMealRepository';
import type { IProfileRepository } from '@/src/data/repositories/IProfileRepository';
import type { IProposalRepository } from '@/src/data/repositories/IProposalRepository';

export type AdapterKind = 'mock' | 'local';

export type Repositories = {
  profile: IProfileRepository;
  meals: IMealRepository;
  activities: IActivityRepository;
  proposals: IProposalRepository;
};

export function createRepositories(adapter: AdapterKind): Repositories {
  if (adapter === 'mock') {
    return {
      profile: new MockProfileRepository(),
      meals: new MockMealRepository(),
      activities: new MockActivityRepository(),
      proposals: new MockProposalRepository(),
    };
  }
  return {
    profile: new LocalProfileRepository(),
    meals: new LocalMealRepository(),
    activities: new LocalActivityRepository(),
    proposals: new LocalProposalRepository(),
  };
}
