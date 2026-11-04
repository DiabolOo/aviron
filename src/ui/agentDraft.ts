import { router } from 'expo-router';
import { create } from 'zustand';

type AgentDraftState = {
  text: string;
  context: string | null;
  nonce: number;
  set: (text: string, context: string | null) => void;
  clearContext: () => void;
};

export const useAgentDraft = create<AgentDraftState>()((set, get) => ({
  text: '',
  context: null,
  nonce: 0,
  set: (text, context) => set({ text, context, nonce: get().nonce + 1 }),
  clearContext: () => set({ context: null }),
}));

export function openAgent(text = '', context: string | null = null): void {
  useAgentDraft.getState().set(text, context);
  router.navigate('/coach');
}
