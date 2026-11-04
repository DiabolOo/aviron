import type { LucideIcon } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { ZodTypeAny } from 'zod';

export type TodayWidget = {
  id: string;
  order: number;
  Component: ComponentType;
  half?: boolean;
};
export type Dashboard = { id: string; title: string; Component: ComponentType };
export type AgentTool = { name: string; description: string; access: 'read' | 'write' };
export type Analyzer = { id: string; cadence: 'daily' | 'weekly' };
export type ModuleColor = 'sport' | 'nutri' | 'iris' | 'aqua';

export interface LifeModule {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  color?: ModuleColor;
  enabledByDefault: boolean;
  entities: ZodTypeAny[];
  todayWidgets: TodayWidget[];
  /** sections de l'onglet Semaine (le prévu et le fait) */
  week?: Dashboard[];
  /** sections de l'onglet Progrès (tendances, volume, courses) */
  progress?: Dashboard[];
  agentTools: AgentTool[];
  agentExamples?: string[];
  analyzers: Analyzer[];
}
