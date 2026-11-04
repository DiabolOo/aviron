import { Target } from 'lucide-react-native';

import type { LifeModule } from '@/src/modules/types';

/** Hors bêta : interface supprimée (tag `pre-v3`), module désactivé par défaut. */
export const goalsModule: LifeModule = {
  id: 'goals',
  title: 'Objectifs',
  description: 'Étapes et progression',
  icon: Target,
  color: 'iris',
  enabledByDefault: false,
  entities: [],
  todayWidgets: [],
  agentTools: [],
  analyzers: [],
};
