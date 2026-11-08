import type { Proposal } from '@/src/core/schemas';
import type { WorkoutSession } from '@/src/core/types';

import {
  cardModel,
  dayFromText,
  formatShortDay,
  formatStamp,
  freeDays,
  isSimpleIntent,
  isSportProposal,
  resolveAdjustment,
  retargetAdjustment,
  type PlanContext,
} from './coachEngine';

// 2026-11-09 est un lundi.
const TODAY = '2026-11-09';

const session = (over: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'ws-1',
  date: '2026-11-10',
  title: 'Sortie longue',
  kind: 'run',
  subtitle: '',
  durationMin: 90,
  caloriesBurn: 0,
  completed: false,
  ...over,
});

const move = (toDate: string, over: Partial<Proposal> = {}): Proposal => ({
  id: 'p-1',
  createdAt: '2026-11-09T07:00:00',
  title: 'Reporter « Sortie longue » à demain',
  source: 'coach',
  action: 'adjust_plan',
  payload: { sessionId: 'ws-1', toDate },
  status: 'pending',
  rationale: 'Tu te sens fatigué',
  confidence: 0.8,
  autoApply: false,
  ...over,
});

const ctx = (over: Partial<PlanContext> = {}): PlanContext => ({ sessions: [session()], today: TODAY, ...over });

describe('portée et vocabulaire', () => {
  it('ne garde que le sport', () => {
    expect(isSportProposal({ action: 'adjust_plan' })).toBe(true);
    expect(isSportProposal({ action: 'create_program' })).toBe(true);
    expect(isSportProposal({ action: 'log_meal' })).toBe(false);
    expect(isSportProposal({ action: 'adjust_nutrition_targets' })).toBe(false);
  });

  it('reconnaît décaler, alléger et fatigue', () => {
    expect(isSimpleIntent('Décale la sortie longue')).toBe(true);
    expect(isSimpleIntent('claqué, 45 min max')).toBe(true);
    expect(isSimpleIntent('Allège ma semaine')).toBe(true);
    expect(isSimpleIntent('Prépare un semi en 1h45')).toBe(false);
  });
});

describe('resolveAdjustment', () => {
  it('laisse passer un jour libre', () => {
    const r = resolveAdjustment(move('2026-11-11'), ctx());
    expect(r).toEqual({ kind: 'ready', proposal: move('2026-11-11') });
  });

  it('pose une question quand le jour demandé est indisponible et que plusieurs jours conviennent', () => {
    const r = resolveAdjustment(move('2026-11-11'), ctx({ unavailableDates: ['2026-11-11'] }));
    expect(r.kind).toBe('ask');
    if (r.kind !== 'ask') return;
    expect(r.question.choices.map((c) => c.id)).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
    expect(r.proposal.rationale).toMatch(/indisponible/);
  });

  it('ne propose jamais un jour indisponible dans les choix', () => {
    const unavailable = ['2026-11-11', '2026-11-12'];
    const r = resolveAdjustment(move('2026-11-11'), ctx({ unavailableDates: unavailable }));
    if (r.kind !== 'ask') throw new Error('question attendue');
    for (const c of r.question.choices) expect(unavailable).not.toContain(c.id);
  });

  it('substitue et l’annonce quand un seul jour est libre', () => {
    const blocked = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-15', '2026-11-16', '2026-11-17'];
    const r = resolveAdjustment(move('2026-11-11'), ctx({ unavailableDates: blocked }));
    expect(r.kind).toBe('ready');
    if (r.kind !== 'ready') return;
    expect(r.proposal.payload.toDate).toBe('2026-11-14');
    expect(r.proposal.rationale).toMatch(/seul jour libre/);
  });

  it('ne propose rien quand aucun jour n’est libre', () => {
    const all = Array.from({ length: 9 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
    const r = resolveAdjustment(move('2026-11-11'), ctx({ unavailableDates: all }));
    expect(r.kind).toBe('blocked');
  });

  it('refuse un jour déjà occupé par une autre séance', () => {
    const other = session({ id: 'ws-2', date: '2026-11-11', title: 'Fractionné' });
    const r = resolveAdjustment(move('2026-11-11'), ctx({ sessions: [session(), other] }));
    expect(r.kind).toBe('ask');
    expect(freeDays(session(), ctx({ sessions: [session(), other] }))).not.toContain('2026-11-11');
  });

  it('ne touche pas aux autres actions', () => {
    const program = move('2026-11-11', { action: 'create_program' });
    expect(resolveAdjustment(program, ctx()).kind).toBe('ready');
  });
});

describe('modification', () => {
  it('lit un jour dans la demande', () => {
    expect(dayFromText('plutôt jeudi', TODAY)).toBe('2026-11-12');
    expect(dayFromText('lundi', TODAY)).toBe('2026-11-16');
    expect(dayFromText('plutôt demain', TODAY)).toBe('2026-11-10');
    expect(dayFromText('après-demain', TODAY)).toBe('2026-11-11');
    expect(dayFromText('moins long', TODAY)).toBeNull();
  });

  it('recrée la proposition sur le nouveau jour', () => {
    const revised = retargetAdjustment(move('2026-11-11'), 'plutôt jeudi', TODAY, new Date('2026-11-09T08:00:00Z'));
    expect(revised?.payload.toDate).toBe('2026-11-12');
    expect(revised?.id).not.toBe('p-1');
    expect(revised?.status).toBe('pending');
  });

  it('rend null sans jour ou hors décalage', () => {
    expect(retargetAdjustment(move('2026-11-11'), 'moins long', TODAY)).toBeNull();
    expect(retargetAdjustment(move('2026-11-11', { action: 'create_program' }), 'jeudi', TODAY)).toBeNull();
  });
});

describe('cardModel', () => {
  it('montre avant et après sans chiffre inventé', () => {
    const m = cardModel(move('2026-11-11'), ctx());
    expect(m.rows).toHaveLength(2);
    expect(m.rows[0]).toMatchObject({ before: 'Sortie longue', after: 'Rien de prévu' });
    expect(m.rows[1]).toMatchObject({ before: undefined, after: 'Sortie longue' });
    expect(m.verified).toBe(true);
    expect(m.confidence).toBe('high');
  });

  it('ne vérifie pas un jour indisponible et attend la réponse à la question', () => {
    const c = ctx({ unavailableDates: ['2026-11-11'] });
    expect(cardModel(move('2026-11-11'), c).verified).toBe(false);
    expect(cardModel(move('2026-11-11'), c, '2026-11-13').verified).toBe(true);
  });

  it('décrit la création d’un programme', () => {
    const program: Proposal = {
      ...move('2026-11-11'),
      action: 'create_program',
      payload: { goal: { type: 'race_prep', targetName: 'Semi', weeklySessionsCount: 3 } },
      preview: { after: '1h45 · 3 séances / sem.' },
    };
    expect(cardModel(program, ctx()).rows).toEqual([{ day: 'Programme', after: '1h45 · 3 séances / sem.' }]);
  });
});

describe('formats de la conversation', () => {
  const now = new Date(2026, 10, 9, 12, 0);
  it('heure d’un message', () => {
    expect(formatStamp(new Date(2026, 10, 9, 8, 12), now)).toBe('08:12');
    expect(formatStamp(new Date(2026, 10, 8, 21, 14), now)).toBe('hier, 21:14');
    expect(formatStamp(new Date(2026, 10, 5, 8, 12), now)).toBe('jeudi 08:12');
  });
  it('jour court du tableau', () => {
    expect(formatShortDay('2026-11-10')).toBe('Mar 10');
  });
});
