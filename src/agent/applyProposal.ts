import {
  parseProposalPayload,
  type ProposalPayload,
} from '@/src/core/proposalActions';
import type { Proposal } from '@/src/core/schemas';
import { usePulseFitStore } from '@/lib/store';

function macrosRespectInvariant(macros: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): boolean {
  if (macros.calories <= 0) return false;
  const kcal = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
  return Math.abs(kcal - macros.calories) / macros.calories <= 0.01;
}

export function applyProposal(
  proposal: Proposal,
  payloadOverride?: ProposalPayload,
): (() => void) | null {
  const parsed = payloadOverride ?? parseProposalPayload(proposal);
  if (!parsed) return null;
  const store = usePulseFitStore.getState();

  switch (parsed.action) {
    case 'adjust_plan': {
      const { sessionId, toDate } = parsed.payload;
      const previous = store.sessions.find((s) => s.id === sessionId)?.date;
      if (!previous) return null;
      store.moveSession(sessionId, toDate);
      return () => usePulseFitStore.getState().moveSession(sessionId, previous);
    }
    case 'log_meal': {
      const mealId = store.addMeal(parsed.payload.meal);
      return () => usePulseFitStore.getState().deleteMeal(mealId);
    }
    case 'adjust_nutrition_targets': {
      const { macros } = parsed.payload;
      if (!macrosRespectInvariant(macros)) return null;
      const previous = store.profile.macrosTarget;
      store.updateProfile({ macrosTarget: macros });
      return () =>
        usePulseFitStore.getState().updateProfile({ macrosTarget: previous });
    }
  }
}
