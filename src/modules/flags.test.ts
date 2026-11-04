import { isModuleEnabled } from './flags';
import type { LifeModule } from './types';

function fakeModule(id: string, enabledByDefault: boolean): LifeModule {
  return {
    id,
    title: id,
    enabledByDefault,
    entities: [],
    todayWidgets: [],
    agentTools: [],
    analyzers: [],
  };
}

describe('isModuleEnabled', () => {
  it('suit enabledByDefault par défaut', () => {
    expect(isModuleEnabled(fakeModule('nutrition', true))).toBe(true);
    expect(isModuleEnabled(fakeModule('test', false))).toBe(false);
  });

  it('un override true active le module test', () => {
    expect(isModuleEnabled(fakeModule('test', false), { test: true })).toBe(true);
  });

  it('un override false désactive nutrition', () => {
    expect(isModuleEnabled(fakeModule('nutrition', true), { nutrition: false })).toBe(false);
  });
});
