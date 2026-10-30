import { BriefPlaceholder } from '@/components/dashboard/BriefPlaceholder';
import { NowCard } from '@/components/dashboard/NowCard';
import { nutritionModule } from '@/src/modules/nutrition';
import { profileModule } from '@/src/modules/profile';
import { sportModule } from '@/src/modules/sport';
import { testModule } from '@/src/modules/test';
import type { LifeModule, TodayWidget } from '@/src/modules/types';
import { ProposalStack } from '@/src/ui/proposals/ProposalStack';

export const MODULES: LifeModule[] = [
  nutritionModule,
  sportModule,
  profileModule,
  testModule,
];

export const CORE_TODAY_WIDGETS: TodayWidget[] = [
  { id: 'now', order: 5, Component: NowCard },
  { id: 'proposals', order: 30, Component: ProposalStack },
  { id: 'brief', order: 60, Component: BriefPlaceholder },
];
