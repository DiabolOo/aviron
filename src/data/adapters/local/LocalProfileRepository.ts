import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProfileSchema, type Profile } from '@/src/core/schemas';
import type { IProfileRepository } from '@/src/data/repositories/IProfileRepository';

const KEY = 'pf:profile';

export class LocalProfileRepository implements IProfileRepository {
  async get(): Promise<Profile | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = ProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  }

  async save(profile: Profile): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
