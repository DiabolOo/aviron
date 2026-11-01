import { createRepositories, type AdapterKind } from '@/src/data/index';

// Dev (M2) : EXPO_PUBLIC_USE_FIXTURE=1 charge le snapshot d'export Strava
// (fixtures/*.snapshot.json, gitignoré) à la place des activités.
const fixtureFlag = process.env.EXPO_PUBLIC_USE_FIXTURE;
const useFixture = fixtureFlag === '1' || fixtureFlag?.toLowerCase() === 'true';

const adapter: AdapterKind = useFixture
  ? 'fixture'
  : process.env.EXPO_PUBLIC_DATA_ADAPTER === 'mock'
    ? 'mock'
    : 'local';

export const repositories = createRepositories(adapter);
