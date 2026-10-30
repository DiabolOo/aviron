import { z } from 'zod';

import { MacrosSchema, MealSchema, type Proposal } from '@/src/core/schemas';

export const AdjustPlanPayloadSchema = z.object({
  sessionId: z.string(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const LogMealPayloadSchema = z.object({
  meal: MealSchema.omit({ id: true }),
});

export const AdjustNutritionTargetsPayloadSchema = z.object({
  macros: MacrosSchema,
});

export type ProposalPayload =
  | { action: 'adjust_plan'; payload: z.infer<typeof AdjustPlanPayloadSchema> }
  | { action: 'log_meal'; payload: z.infer<typeof LogMealPayloadSchema> }
  | {
      action: 'adjust_nutrition_targets';
      payload: z.infer<typeof AdjustNutritionTargetsPayloadSchema>;
    };

export function parseProposalPayload(
  proposal: Pick<Proposal, 'action' | 'payload'>,
  payloadOverride?: Record<string, unknown>,
): ProposalPayload | null {
  const raw = payloadOverride ?? proposal.payload;
  switch (proposal.action) {
    case 'adjust_plan': {
      const r = AdjustPlanPayloadSchema.safeParse(raw);
      return r.success ? { action: 'adjust_plan', payload: r.data } : null;
    }
    case 'log_meal': {
      const r = LogMealPayloadSchema.safeParse(raw);
      return r.success ? { action: 'log_meal', payload: r.data } : null;
    }
    case 'adjust_nutrition_targets': {
      const r = AdjustNutritionTargetsPayloadSchema.safeParse(raw);
      return r.success
        ? { action: 'adjust_nutrition_targets', payload: r.data }
        : null;
    }
  }
}
