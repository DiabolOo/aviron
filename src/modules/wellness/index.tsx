import { HeartPulse } from 'lucide-react-native';

import type { LifeModule } from '@/src/modules/types';

/** Hors bêta : interface (Forme / batterie d'énergie) supprimée, module désactivé par défaut. */
export const wellnessModule: LifeModule = {
  id: 'wellness',
  title: 'Forme & sommeil',
  description: 'Apple Santé, récupération',
  icon: HeartPulse,
  color: 'aqua',
  enabledByDefault: false,
  entities: [],
  todayWidgets: [],
  agentTools: [],
  analyzers: [],
};
