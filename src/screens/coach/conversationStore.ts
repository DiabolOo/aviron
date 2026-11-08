import { create } from 'zustand';

import type { AdjustQuestion } from '@/src/screens/coach/coachEngine';

export type TurnSource = 'device' | 'ai';

export type Turn =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'coach'; text: string; detail?: string; source: TurnSource }
  | { id: string; kind: 'proposal'; proposalId: string; source: TurnSource; question?: AdjustQuestion };

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type TurnInput = DistributiveOmit<Turn, 'id'>;

type ConversationState = {
  turns: Turn[];
  /** Réponse choisie à la question d'une proposition (id de proposition → id du choix). */
  answers: Record<string, string>;
  push: (...turns: TurnInput[]) => void;
  answer: (proposalId: string, choice: string) => void;
  reset: () => void;
};

let counter = 0;

/** La conversation du jour : en mémoire, les propositions elles-mêmes vivent dans le store des propositions. */
export const useConversation = create<ConversationState>()((set, get) => ({
  turns: [],
  answers: {},
  push: (...inputs) => set({ turns: [...get().turns, ...inputs.map((t) => ({ ...t, id: `turn-${++counter}` }) as Turn)] }),
  answer: (proposalId, choice) => set({ answers: { ...get().answers, [proposalId]: choice } }),
  reset: () => set({ turns: [], answers: {} }),
}));
