import { ProposalSchema } from '@/src/core/schemas';
import type { UserProfile, WorkoutSession } from '@/src/core/types';

import { MockAgent } from './MockAgent';

const profile: UserProfile = {
  firstName: 'Alex',
  goalLabel: '',
  calorieTarget: 2500,
  macrosTarget: { calories: 2500, protein: 150, carbs: 300, fat: 80 },
  weightKg: 74,
  targetWeightKg: 74,
};

const longRun: WorkoutSession = {
  id: 's-long',
  date: '2026-10-31',
  title: 'Sortie longue',
  kind: 'run',
  subtitle: '14 km',
  durationMin: 90,
  caloriesBurn: 900,
  completed: false,
};

describe('MockAgent.interpretIntent', () => {
  const ctx = { sessions: [longRun], profile, today: '2026-10-30' };

  it.each([
    ['claqué, 45 min max', 'adjust_plan'],
    ['décale la sortie longue au dimanche', 'adjust_plan'],
    ['j’ai mangé des pâtes au déjeuner', 'log_meal'],
  ])('« %s » produit une proposition valide', async (text, action) => {
    const { proposals } = await new MockAgent().interpretIntent(text, ctx);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].action).toBe(action);
    expect(() => ProposalSchema.parse(proposals[0])).not.toThrow();
  });

  it('répond sans proposition quand rien n’est compris', async () => {
    const { proposals, reply } = await new MockAgent().interpretIntent('blabla', ctx);
    expect(proposals).toHaveLength(0);
    expect(reply.length).toBeGreaterThan(0);
  });

  it('n’invente pas de séance à reporter', async () => {
    const { proposals } = await new MockAgent().interpretIntent('claqué', { ...ctx, sessions: [] });
    expect(proposals).toHaveLength(0);
  });
});

describe('MockAgent.getPendingProposals', () => {
  it('renvoie des propositions conformes au schéma', async () => {
    const proposals = await new MockAgent().getPendingProposals({
      sessions: [longRun],
      profile,
      today: '2026-10-30',
    });
    expect(proposals).toHaveLength(3);
    for (const p of proposals) {
      expect(() => ProposalSchema.parse(p)).not.toThrow();
    }
  });

  it('ne propose pas de déplacement sans sortie longue', async () => {
    const proposals = await new MockAgent().getPendingProposals({
      sessions: [],
      profile,
      today: '2026-10-30',
    });
    expect(proposals.every((p) => p.action !== 'adjust_plan')).toBe(true);
  });

  it('les macros proposées restent cohérentes (+160 kcal pour +40 g)', async () => {
    const proposals = await new MockAgent().getPendingProposals({
      sessions: [],
      profile,
      today: '2026-10-30',
    });
    const boost = proposals.find((p) => p.action === 'adjust_nutrition_targets');
    expect(boost?.payload).toEqual({
      macros: { calories: 2660, protein: 150, carbs: 340, fat: 80 },
    });
  });
});
