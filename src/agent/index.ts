import { MockAgent } from '@/src/agent/MockAgent';
import type { IAgent } from '@/src/agent/types';

export const agent: IAgent = new MockAgent();
