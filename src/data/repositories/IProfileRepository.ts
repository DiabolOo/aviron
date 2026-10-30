import type { Profile } from '@/src/core/schemas';

export interface IProfileRepository {
  get(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
  clear(): Promise<void>;
}
