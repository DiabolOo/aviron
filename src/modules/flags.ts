import type { LifeModule } from '@/src/modules/types';

export const MODULE_FLAG_OVERRIDES: Partial<Record<string, boolean>> = {};

export function isModuleEnabled(
  module: LifeModule,
  overrides: Partial<Record<string, boolean>> = MODULE_FLAG_OVERRIDES,
): boolean {
  return overrides[module.id] ?? module.enabledByDefault;
}
