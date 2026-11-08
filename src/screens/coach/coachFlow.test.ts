import { MockAgent } from '@/src/agent/MockAgent';
import type { IAgent, IntentContext, IntentResult } from '@/src/agent/types';
import type { UserProfile, WorkoutSession } from '@/src/core/types';

import {
  AI_UNAVAILABLE,
  FALLBACK_NOTICE,
  LOCAL_ONLY,
  REVISED_REPLY,
  SCOPE_REPLY,
  runCoachRequest,
} from './coachFlow';

const TODAY = '2026-11-09';

const session: WorkoutSession = {
  id: 'ws-1',
  date: '2026-11-10',
  title: 'Sortie longue',
  kind: 'run',
  subtitle: '',
  durationMin: 90,
  caloriesBurn: 0,
  completed: false,
};

const ctx = (unavailableDates?: string[]): IntentContext => ({
  sessions: [session],
  profile: { unavailableDates } as UserProfile,
  today: TODAY,
});

const engine = new MockAgent();

function fake(handler: (text: string) => Promise<IntentResult>, isModel = true): IAgent & { calls: string[] } {
  const calls: string[] = [];
  return {
    isModel,
    calls,
    interpretIntent: (text) => {
      calls.push(text);
      return handler(text);
    },
    analyzePlate: jest.fn(),
    getPendingProposals: jest.fn(),
  };
}

const run = (over: Partial<Parameters<typeof runCoachRequest>[0]>) =>
  runCoachRequest({ text: 'claqué, 45 min max', consent: false, ctx: ctx(), agent: engine, engine, ...over });

describe('sans accord IA', () => {
  it('le moteur du téléphone traite la fatigue, source « téléphone »', async () => {
    const out = await run({});
    expect(out.proposals).toHaveLength(1);
    expect(out.proposals[0].action).toBe('adjust_plan');
    const sources = out.turns.map((t) => ('source' in t ? t.source : null)).filter(Boolean);
    expect(sources.every((s) => s === 'device')).toBe(true);
  });

  it('ne présente pas l’IA comme un manque et n’appelle pas la passerelle', async () => {
    const agent = fake(async () => ({ reply: 'x', proposals: [] }));
    const out = await run({ text: 'Prépare un semi en 1h45 dans 10 semaines', agent });
    expect(agent.calls).toHaveLength(0);
    expect(out.proposals).toHaveLength(0);
    expect(out.turns).toEqual([{ kind: 'coach', text: LOCAL_ONLY, source: 'device' }]);
    expect(LOCAL_ONLY).not.toMatch(/manque|impossible|désolé/i);
  });
});

describe('avec accord IA', () => {
  const reply = (toDate: string): IntentResult => ({
    reply: 'Je te propose de décaler.',
    proposals: [
      {
        id: 'ai-1',
        createdAt: '2026-11-09T08:00:00',
        title: 'Décaler la sortie longue',
        source: 'coach',
        action: 'adjust_plan',
        payload: { sessionId: 'ws-1', toDate },
        status: 'pending',
        rationale: 'Pluie samedi',
        confidence: 0.9,
        autoApply: false,
      },
    ],
  });

  it('un modèle rédige : source « ai »', async () => {
    const out = await run({ consent: true, agent: fake(async () => reply('2026-11-11')) });
    expect(out.turns[0]).toMatchObject({ kind: 'coach', source: 'ai' });
    expect(out.turns[1]).toMatchObject({ kind: 'proposal', source: 'ai' });
  });

  it('un agent qui n’est pas un modèle n’est jamais annoncé comme IA', async () => {
    const out = await run({ consent: true, agent: fake(async () => reply('2026-11-11'), false) });
    expect(out.turns.every((t) => !('source' in t) || t.source === 'device')).toBe(true);
  });

  it('repli sur le moteur si l’IA échoue, annoncé clairement', async () => {
    const out = await run({ consent: true, agent: fake(() => Promise.reject(new Error('réseau'))) });
    expect(out.proposals).toHaveLength(1);
    expect(out.turns[0]).toMatchObject({ kind: 'coach', source: 'device', detail: FALLBACK_NOTICE });
  });

  it('sortie invalide : un nouvel essai, puis repli', async () => {
    const bad: IntentResult = { reply: 'ok', proposals: [{ ...reply('x').proposals[0], payload: { nope: 1 } }] };
    const agent = fake(async () => bad);
    const out = await run({ consent: true, agent });
    expect(agent.calls).toHaveLength(2);
    expect(out.turns[0]).toMatchObject({ source: 'device', detail: FALLBACK_NOTICE });
  });

  it('demande libre + IA en échec : dit que l’IA est indisponible', async () => {
    const out = await run({
      text: 'Prépare un semi en 1h45 dans 10 semaines',
      consent: true,
      agent: fake(() => Promise.reject(new Error('réseau'))),
    });
    expect(out.proposals).toHaveLength(0);
    expect(out.turns).toEqual([{ kind: 'coach', text: AI_UNAVAILABLE, source: 'device' }]);
  });
});

describe('portée et plan', () => {
  it('écarte la nutrition (hors bêta)', async () => {
    const out = await run({ text: 'décale, j’ai mangé des pâtes', consent: true, agent: fake(async () => engine.interpretIntent('j’ai mangé des pâtes', ctx())) });
    expect(out.proposals).toHaveLength(0);
    expect(out.turns).toEqual([{ kind: 'coach', text: SCOPE_REPLY, source: 'device' }]);
  });

  it('pose une question quand le jour demandé est indisponible', async () => {
    const out = await run({ ctx: ctx(['2026-11-11']) });
    const turn = out.turns.find((t) => t.kind === 'proposal');
    expect(turn && 'question' in turn && turn.question?.choices.length).toBeGreaterThan(1);
  });

  it('ne place jamais la séance un jour indisponible', async () => {
    const out = await run({ ctx: ctx(['2026-11-11']) });
    expect(out.proposals[0].payload.toDate).not.toBe('2026-11-11');
  });
});

describe('modifier', () => {
  it('« plutôt jeudi » remplace la proposition sans appeler l’IA', async () => {
    const first = await run({});
    const agent = fake(async () => ({ reply: 'x', proposals: [] }));
    const out = await run({ text: 'plutôt jeudi', editing: first.proposals[0], consent: true, agent });
    expect(agent.calls).toHaveLength(0);
    expect(out.supersedes).toBe(first.proposals[0].id);
    expect(out.proposals[0].payload.toDate).toBe('2026-11-12');
    expect(out.turns[0]).toMatchObject({ text: REVISED_REPLY });
  });

  it('sans jour cité, la proposition en contexte est transmise au modèle', async () => {
    const first = await run({});
    const agent = fake(async () => ({ reply: 'D’accord.', proposals: [] }));
    await run({ text: 'moins long', editing: first.proposals[0], consent: true, agent });
    expect(agent.calls[0]).toContain(first.proposals[0].title);
    expect(agent.calls[0]).toContain('moins long');
  });
});
