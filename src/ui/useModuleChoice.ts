import { create } from 'zustand';

type ChoiceState = {
  choices: Record<string, string>;
  choose: (scope: string, id: string) => void;
};

const useChoiceStore = create<ChoiceState>()((set, get) => ({
  choices: {},
  choose: (scope, id) => set({ choices: { ...get().choices, [scope]: id } }),
}));

export function useModuleChoice(scope: string, ids: string[]): [string, (id: string) => void] {
  const saved = useChoiceStore((s) => s.choices[scope]);
  const choose = useChoiceStore((s) => s.choose);
  const value = saved && ids.includes(saved) ? saved : ids[0];
  return [value, (id) => choose(scope, id)];
}
