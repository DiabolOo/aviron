import { HeartPulse } from 'lucide-react-native';

import { EnergyBatteryWidget } from '@/components/dashboard/EnergyBatteryWidget';
import type { LifeModule } from '@/src/modules/types';

export const wellnessModule: LifeModule = {
  id: 'wellness',
  title: 'Forme & sommeil',
  description: 'Apple Santé, récupération',
  icon: HeartPulse,
  color: 'aqua',
  enabledByDefault: true,
  entities: [],
  todayWidgets: [{ id: 'forme', order: 30, Component: EnergyBatteryWidget, half: true }],
  dashboards: [],
  agentTools: [],
  analyzers: [],
};
