import { createRepositories, type AdapterKind } from '@/src/data/index';

const adapter: AdapterKind =
  process.env.EXPO_PUBLIC_DATA_ADAPTER === 'mock' ? 'mock' : 'local';

export const repositories = createRepositories(adapter);
