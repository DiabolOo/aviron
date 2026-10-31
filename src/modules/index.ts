import { CoachWidget } from '@/components/dashboard/CoachWidget';
import { nutritionModule } from '@/src/modules/nutrition';
import { goalsModule } from '@/src/modules/goals';
import { profileModule } from '@/src/modules/profile';
import { sportModule } from '@/src/modules/sport';
import { testModule } from '@/src/modules/test';
import { wellnessModule } from '@/src/modules/wellness';
import type { LifeModule, TodayWidget } from '@/src/modules/types';

export const MODULES: LifeModule[] = [
  nutritionModule,
  sportModule,
  wellnessModule,
  goalsModule,
  profileModule,
  testModule,
];

export const CORE_TODAY_WIDGETS: TodayWidget[] = [
  { id: 'coach', order: 40, Component: CoachWidget },
];
