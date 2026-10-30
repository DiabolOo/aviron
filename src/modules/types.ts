import type { ComponentType } from 'react';
import type { ZodTypeAny } from 'zod';

export type TodayWidget = { id: string; order: number; Component: ComponentType };
export type Dashboard = { id: string; title: string; Component: ComponentType };
export type AgentTool = { name: string; description: string; access: 'read' | 'write' };
export type Analyzer = { id: string; cadence: 'daily' | 'weekly' };

export interface LifeModule {
  id: string;
  title: string;
  enabledByDefault: boolean;
  entities: ZodTypeAny[];
  todayWidgets: TodayWidget[];
  dashboards: Dashboard[];
  agentTools: AgentTool[];
  analyzers: Analyzer[];
}
