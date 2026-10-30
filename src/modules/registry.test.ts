import { collectTodayWidgets, getEnabledModules } from './registry';
import type { LifeModule } from './types';

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
    dashboards: [],
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

