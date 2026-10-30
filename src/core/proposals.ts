import type { ProposalStatus } from '@/src/core/schemas';

export type ProposalEvent = 'accept' | 'edit' | 'reject' | 'undo';

const TRANSITIONS: Record<ProposalStatus, Partial<Record<ProposalEvent, ProposalStatus>>> = {
  pending: { accept: 'accepted', edit: 'edited', reject: 'rejected' },
  accepted: { undo: 'undone' },
  edited: { undo: 'undone' },
  rejected: {},
  undone: {},
};

export function transition(
  status: ProposalStatus,
  event: ProposalEvent,
): ProposalStatus | null {
  return TRANSITIONS[status][event] ?? null;
}
