import type { Proposal } from '@/src/core/schemas';
import type {
  FatigueLevel,
  Meal,
  TimeBudget,
  UserProfile,
  WorkoutSession,
} from '@/src/core/types';

export type AdaptWeekParams = {
  fatigue: FatigueLevel;
  timeBudget: TimeBudget;
  sessions: WorkoutSession[];
};

export type ProposalContext = {
  sessions: WorkoutSession[];
  profile: UserProfile;
  today: string;
};

export type IntentResult = { reply: string; proposals: Proposal[] };

export interface IAgent {
  interpretIntent(text: string, context: ProposalContext): Promise<IntentResult>;
  analyzePlate(photoUri: string): Promise<Meal>;
  adaptWeek(params: AdaptWeekParams): Promise<WorkoutSession[]>;
  generateDefaultWeek(): Promise<WorkoutSession[]>;
  getPendingProposals(context: ProposalContext): Promise<Proposal[]>;
}
