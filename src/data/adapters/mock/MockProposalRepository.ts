import type { Proposal } from '@/src/core/schemas';
import type { IProposalRepository } from '@/src/data/repositories/IProposalRepository';

export class MockProposalRepository implements IProposalRepository {
  private proposals: Proposal[] = [];

  async list(): Promise<Proposal[]> {
    return [...this.proposals];
  }

  async upsert(proposal: Proposal): Promise<void> {
    const idx = this.proposals.findIndex((p) => p.id === proposal.id);
    if (idx >= 0) {
      this.proposals[idx] = proposal;
    } else {
      this.proposals.push(proposal);
    }
  }

  async remove(id: string): Promise<void> {
    this.proposals = this.proposals.filter((p) => p.id !== id);
  }

  async clear(): Promise<void> {
    this.proposals = [];
  }
}
