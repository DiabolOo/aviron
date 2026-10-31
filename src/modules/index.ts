import { CoachWidget } from '@/components/dashboard/CoachWidget';
import { nutritionModule } from '@/src/modules/nutrition';
import { profileModule } from '@/src/modules/profile';
import { sportModule } from '@/src/modules/sport';
import { testModule } from '@/src/modules/test';
import type { LifeModule, TodayWidget } from '@/src/modules/types';

export const MODULES: LifeModule[] = [
  nutritionModule,
  sportModule,
  profileModule,
  testModule,
];

export const CORE_TODAY_WIDGETS: TodayWidget[] = [
  { id: 'coach', order: 40, Component: CoachWidget },
];
