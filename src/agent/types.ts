import type { Proposal } from '@/src/core/schemas';
import type { Meal, UserProfile, WorkoutSession } from '@/src/core/types';

export type ProposalContext = {
  sessions: WorkoutSession[];
  profile: UserProfile;
  today: string;
};

export type IntentResult = {
  reply: string;
  proposals: Proposal[];
  navigateTo?: '/profile' | '/profile/modules';
};

export type IntentContext = ProposalContext & { mealPlanSeed?: number };

export interface IAgent {
  /** Vrai seulement si les textes sont rédigés par un modèle : seul cas où « Rédigé par l'IA » est vrai. */
  readonly isModel?: boolean;
  interpretIntent(text: string, context: IntentContext): Promise<IntentResult>;
  analyzePlate(photoUri: string): Promise<Meal>;
  getPendingProposals(context: ProposalContext): Promise<Proposal[]>;
}
