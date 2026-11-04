import { MODULES } from '@/src/modules';
import { collectSections, collectTodayWidgets, getEnabledModules } from './registry';
import type { LifeModule } from './types';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn() } }));
jest.mock('lucide-react-native', () => new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k as keyof typeof t] : () => null) }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const Dummy = () => null;

function fakeModule(id: string, orders: number[], enabled = true): LifeModule {
  return {
    id,
    title: id,
    enabledByDefault: enabled,
    entities: [],
    todayWidgets: orders.map((order, i) => ({
      id: `w${i}`,
      order,
      Component: Dummy,
    })),
    agentTools: [],
    analyzers: [],
  };
}

const byDefault = (m: LifeModule) => m.enabledByDefault;

describe('getEnabledModules', () => {
  it('filtre via le prédicat isEnabled', () => {
    const modules = [fakeModule('a', []), fakeModule('b', [], false)];
    expect(getEnabledModules(modules, byDefault).map((m) => m.id)).toEqual(['a']);
    expect(getEnabledModules(modules, () => true).map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('collectTodayWidgets', () => {
  it('trie par order et préfixe les ids par moduleId', () => {
    const modules = [fakeModule('m1', [40, 10]), fakeModule('m2', [20])];
    const widgets = collectTodayWidgets(modules, byDefault);
    expect(widgets.map((w) => w.id)).toEqual(['m1:w1', 'm2:w0', 'm1:w0']);
  });

  it('ignore les widgets des modules désactivés', () => {
    const modules = [fakeModule('on', [10]), fakeModule('off', [5], false)];
    expect(collectTodayWidgets(modules, byDefault).map((w) => w.id)).toEqual(['on:w0']);
  });
});


describe('collectSections', () => {
  it('ordonne les sections selon l’ordre demandé et ignore les modules désactivés', () => {
    const mk = (id: string, enabled = true): LifeModule => ({
      ...fakeModule(id, [], enabled),
      week: [{ id: `${id}-plan`, title: id, Component: Dummy }],
    });
    const modules = [mk('sport'), mk('nutrition'), mk('goals', false)];
    const sections = collectSections(modules, byDefault, 'week', ['nutrition', 'sport']);
    expect(sections.map((s) => s.id)).toEqual(['nutrition-plan', 'sport-plan']);
  });
});

describe('MODULES (bêta limitée au sport)', () => {
  const ids = (on: boolean) => MODULES.filter((m) => m.enabledByDefault === on).map((m) => m.id).sort();

  it('seuls sport et profil sont actifs par défaut', () => {
    expect(ids(true)).toEqual(['profile', 'sport']);
    expect(ids(false)).toEqual(['goals', 'nutrition', 'wellness']);
  });

  it('les modules hors bêta n’ajoutent aucune section ni widget', () => {
    for (const m of MODULES.filter((m) => !m.enabledByDefault)) {
      expect(m.week ?? []).toEqual([]);
      expect(m.progress ?? []).toEqual([]);
      expect(m.todayWidgets).toEqual([]);
    }
  });

  it('le module sport alimente Semaine et Progrès', () => {
    const sections = (section: 'week' | 'progress') =>
      collectSections(MODULES, byDefault, section).map((s) => s.id);
    expect(sections('week')).toEqual(['sport-plan', 'sport']);
    expect(sections('progress')).toEqual(['sport-trends']);
  });
});
