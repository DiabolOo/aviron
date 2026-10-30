import type { Proposal } from '@/src/core/schemas';

export interface IProposalRepository {
  list(): Promise<Proposal[]>;
  upsert(proposal: Proposal): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
