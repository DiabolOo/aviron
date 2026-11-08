/**
 * Une demande au coach, de bout en bout : qui répond (moteur du téléphone ou IA avec accord),
 * validation de la sortie, repli sur le moteur, portée de la bêta, jours indisponibles.
 * Aucune écriture : les propositions sont rendues, c'est l'écran qui les enregistre.
 */
import type { IAgent, IntentContext, IntentResult } from '@/src/agent/types';
import { parseProposalPayload } from '@/src/core/proposalActions';
import { ProposalSchema, type Proposal } from '@/src/core/schemas';
import {
  isSimpleIntent,
  isSportProposal,
  resolveAdjustment,
  retargetAdjustment,
  type PlanContext,
} from '@/src/screens/coach/coachEngine';
import type { TurnInput, TurnSource } from '@/src/screens/coach/conversationStore';

export const FALLBACK_NOTICE = 'Le coach IA n’a pas répondu : voici la réponse calculée sur ton téléphone.';
export const AI_UNAVAILABLE = 'Le coach IA est indisponible pour le moment. Réessaie dans un instant.';
export const LOCAL_ONLY =
  'Sur ton téléphone, je peux décaler une séance, l’alléger ou tenir compte de ta fatigue. Essaie « claqué, 45 min max » ou « décale la sortie longue ».';
export const SCOPE_REPLY = 'Pour l’instant, je m’occupe de ton sport : décaler, alléger ou construire un plan.';
export const REVISED_REPLY = 'Voilà la version modifiée.';
const MAX_TRIES = 2;

export type FlowInput = {
  text: string;
  /** Proposition que l'utilisateur est en train de modifier. */
  editing?: Proposal;
  /** Accord explicite pour le coach IA. */
  consent: boolean;
  ctx: IntentContext;
  /** Passerelle IA. Rédigé par l'IA seulement si `agent.isModel`. */
  agent: IAgent;
  /** Moteur du téléphone. */
  engine: IAgent;
};

export type FlowOutput = {
  turns: TurnInput[];
  proposals: Proposal[];
  /** Proposition remplacée par la nouvelle (à refuser). */
  supersedes?: string;
  navigateTo?: IntentResult['navigateTo'];
};

const valid = (r: IntentResult): boolean =>
  r.proposals.every((p) => ProposalSchema.safeParse(p).success && parseProposalPayload(p) !== null);

/** Toute sortie d'IA est validée ; sinon un nouvel essai, puis échec. */
async function askValidated(agent: IAgent, text: string, ctx: IntentContext): Promise<IntentResult> {
  for (let i = 0; i < MAX_TRIES; i++) {
    const result = await agent.interpretIntent(text, ctx);
    if (valid(result)) return result;
  }
  throw new Error('invalid-agent-output');
}

function finish(
  result: IntentResult,
  source: TurnSource,
  plan: PlanContext,
  extra: { notice?: string; supersedes?: string },
): FlowOutput {
  const turns: TurnInput[] = [];
  const proposals: Proposal[] = [];
  const blocked: string[] = [];
  const sport = result.proposals.filter(isSportProposal);
  const outOfScope = sport.length < result.proposals.length;

  const proposalTurns: TurnInput[] = [];
  for (const proposal of sport) {
    const adjustment = resolveAdjustment(proposal, plan);
    if (adjustment.kind === 'blocked') {
      blocked.push(adjustment.message);
      continue;
    }
    proposals.push(adjustment.proposal);
    proposalTurns.push({
      kind: 'proposal',
      proposalId: adjustment.proposal.id,
      source,
      ...(adjustment.kind === 'ask' ? { question: adjustment.question } : {}),
    });
  }

  if (outOfScope && sport.length === 0) turns.push({ kind: 'coach', text: SCOPE_REPLY, source: 'device' });
  else if (proposals.length > 0 || blocked.length === 0) {
    turns.push({ kind: 'coach', text: result.reply, source, ...(extra.notice ? { detail: extra.notice } : {}) });
  }
  for (const message of blocked) turns.push({ kind: 'coach', text: message, source: 'device' });
  turns.push(...proposalTurns);

  return {
    turns,
    proposals,
    supersedes: proposals.length > 0 ? extra.supersedes : undefined,
    navigateTo: result.navigateTo,
  };
}

export async function runCoachRequest({ text, editing, consent, ctx, agent, engine }: FlowInput): Promise<FlowOutput> {
  const plan: PlanContext = { sessions: ctx.sessions, unavailableDates: ctx.profile.unavailableDates, today: ctx.today };

  if (editing) {
    const revised = retargetAdjustment(editing, text, ctx.today);
    if (revised) return finish({ reply: REVISED_REPLY, proposals: [revised] }, 'device', plan, { supersedes: editing.id });
  }

  const supersedes = editing?.id;
  const simple = isSimpleIntent(text);

  if (consent) {
    try {
      const query = editing && agent.isModel ? `${editing.title} — ${text}` : text;
      const result = await askValidated(agent, query, ctx);
      return finish(result, agent.isModel ? 'ai' : 'device', plan, { supersedes });
    } catch {
      if (!simple) return { turns: [{ kind: 'coach', text: AI_UNAVAILABLE, source: 'device' }], proposals: [] };
      const result = await engine.interpretIntent(text, ctx);
      return finish(result, 'device', plan, { supersedes, notice: FALLBACK_NOTICE });
    }
  }

  if (!simple) return { turns: [{ kind: 'coach', text: LOCAL_ONLY, source: 'device' }], proposals: [] };
  return finish(await engine.interpretIntent(text, ctx), 'device', plan, { supersedes });
}
