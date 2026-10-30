import type { Profile } from '@/src/core/schemas';
import { MOCK_PROFILE } from '@/src/data/mock';
import type { IProfileRepository } from '@/src/data/repositories/IProfileRepository';

export class MockProfileRepository implements IProfileRepository {
  private profile: Profile | null = MOCK_PROFILE as Profile;

  async get(): Promise<Profile | null> {
    return this.profile;
  }

  async save(profile: Profile): Promise<void> {
    this.profile = profile;
  }

  async clear(): Promise<void> {
    this.profile = null;
  }
}
