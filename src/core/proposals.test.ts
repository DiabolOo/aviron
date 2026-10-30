import { transition, type ProposalEvent } from './proposals';
import type { ProposalStatus } from './schemas';

const STATUSES: ProposalStatus[] = ['pending', 'accepted', 'edited', 'rejected', 'undone'];
const EVENTS: ProposalEvent[] = ['accept', 'edit', 'reject', 'undo'];

const EXPECTED: Record<ProposalStatus, Partial<Record<ProposalEvent, ProposalStatus>>> = {
  pending: { accept: 'accepted', edit: 'edited', reject: 'rejected' },
  accepted: { undo: 'undone' },
  edited: { undo: 'undone' },
  rejected: {},
  undone: {},
};

describe('transition', () => {
  for (const status of STATUSES) {
    for (const event of EVENTS) {
      const expected = EXPECTED[status][event];
      it(`${status} + ${event} → ${expected ?? 'null'}`, () => {
        expect(transition(status, event)).toBe(expected ?? null);
      });
    }
  }
});
