import { usePulseFitStore } from '@/lib/store';
import { isModuleEnabled } from '@/src/modules/flags';
import type { LifeModule } from '@/src/modules/types';

export function useIsModuleEnabled(): (module: LifeModule) => boolean {
  const flags = usePulseFitStore((s) => s.moduleFlags);
  return (module) => isModuleEnabled(module, flags);
}
