import { create } from 'zustand';

import { agent } from '@/src/agent';
import { applyProposal } from '@/src/agent/applyProposal';
import { toISODate } from '@/src/core/dates';
import { parseProposalPayload } from '@/src/core/proposalActions';
import { transition } from '@/src/core/proposals';
import type { Proposal, ProposalStatus } from '@/src/core/schemas';
import { repositories } from '@/src/data/instance';
import { usePulseFitStore } from '@/lib/store';

const revertFns = new Map<string, () => void>();

type ProposalState = {
  proposals: Proposal[];
  loaded: boolean;
  lastResolved: { id: string; label: string } | null;
  load: () => Promise<void>;
  accept: (id: string) => Promise<void>;
  edit: (id: string, payload: Record<string, unknown>) => Promise<void>;
  reject: (id: string) => Promise<void>;
  undo: (id: string) => Promise<void>;
  dismissToast: () => void;
};

export const useProposalStore = create<ProposalState>()((set, get) => {
  const resolve = async (id: string, status: ProposalStatus, patch?: Partial<Proposal>) => {
    const proposal = get().proposals.find((p) => p.id === id);
    if (!proposal) return;
    const next: Proposal = {
      ...proposal,
      ...patch,
      status,
      resolvedAt: new Date().toISOString(),
    };
    set({ proposals: get().proposals.map((p) => (p.id === id ? next : p)) });
    await repositories.proposals.upsert(next);
  };

  return {
    proposals: [],
    loaded: false,
    lastResolved: null,
    load: async () => {
      if (get().loaded) return;
      let proposals = await repositories.proposals.list();
      if (proposals.length === 0) {
        const main = usePulseFitStore.getState();
        proposals = await agent.getPendingProposals({
          sessions: main.sessions,
          profile: main.profile,
          today: toISODate(new Date()),
        });
        for (const proposal of proposals) {
          await repositories.proposals.upsert(proposal);
        }
      }
      set({ proposals, loaded: true });
    },
    accept: async (id) => {
      const proposal = get().proposals.find((p) => p.id === id);
      if (!proposal || proposal.status !== 'pending') return;
      const revert = applyProposal(proposal);
      if (!revert) return;
      revertFns.set(id, revert);
      await resolve(id, transition('pending', 'accept') ?? 'accepted');
      set({ lastResolved: { id, label: proposal.title } });
    },
    edit: async (id, payload) => {
      const proposal = get().proposals.find((p) => p.id === id);
      if (!proposal || proposal.status !== 'pending') return;
      const parsed = parseProposalPayload(proposal, payload);
      if (!parsed) return;
      const revert = applyProposal(proposal, parsed);
      if (!revert) return;
      revertFns.set(id, revert);
      await resolve(id, transition('pending', 'edit') ?? 'edited', {
        editedPayload: payload,
      });
      set({ lastResolved: { id, label: proposal.title } });
    },
    reject: async (id) => {
      await resolve(id, transition('pending', 'reject') ?? 'rejected');
    },
    undo: async (id) => {
      const proposal = get().proposals.find((p) => p.id === id);
      if (!proposal) return;
      const next = transition(proposal.status, 'undo');
      if (!next) return;
      revertFns.get(id)?.();
      revertFns.delete(id);
      await resolve(id, next);
      set({ lastResolved: null });
    },
    dismissToast: () => set({ lastResolved: null }),
  };
});
