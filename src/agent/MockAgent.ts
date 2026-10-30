import type { Meal, WorkoutSession } from '@/src/core/types';
import type { AdaptWeekParams, IAgent } from '@/src/agent/types';
import { buildWeekSessions, mockAdaptWeek, mockAnalyzePlate } from '@/src/data/mock';

export class MockAgent implements IAgent {
  analyzePlate(photoUri: string): Promise<Meal> {
    return mockAnalyzePlate(photoUri);
  }

  adaptWeek(params: AdaptWeekParams): Promise<WorkoutSession[]> {
    return mockAdaptWeek(params);
  }

  async generateDefaultWeek(): Promise<WorkoutSession[]> {
    return buildWeekSessions();
  }
}
