import { addDaysISO } from '@/src/core/dates';
import type { Proposal } from '@/src/core/schemas';
import type { Meal, WorkoutSession } from '@/src/core/types';
import type { AdaptWeekParams, IAgent, ProposalContext } from '@/src/agent/types';
import { buildWeekSessions, mockAdaptWeek, mockAnalyzePlate } from '@/src/data/mock';

function nextSunday(date: string): string {
  const dow = new Date(`${date}T00:00:00`).getDay();
  return addDaysISO(date, (7 - dow) % 7 || 7);
}

export class MockAgent implements IAgent {
  analyzePlate(photoUri: string): Promise<Meal> {
    return mockAnalyzePlate(photoUri);
  }

  adaptWeek(params: AdaptWeekParams): Promise<WorkoutSession[]> {
    return mockAdaptWeek(params);
  }

  async generateDefaultWeek(): Promise<WorkoutSession[]> {
    return buildWeekSessions();
  }

  async getPendingProposals({ sessions, profile, today }: ProposalContext): Promise<Proposal[]> {
    const proposals: Proposal[] = [];
    const createdAt = `${today}T07:00:00`;

    const longRun = sessions.find(
      (s) => !s.completed && s.title.toLowerCase().includes('longue'),
    );
    if (longRun) {
      proposals.push({
        id: 'prop-move-long-run',
        createdAt,
        title: 'Décaler la sortie longue à dimanche',
        source: 'coach',
        action: 'adjust_plan',
        payload: { sessionId: longRun.id, toDate: nextSunday(longRun.date) },
        status: 'pending',
        rationale: 'Pluie prévue samedi · 14 km',
        confidence: 0.92,
        autoApply: false,
        preview: { before: 'Sam.', after: 'Dim.' },
      });
    }

    const target = profile.macrosTarget;
    proposals.push({
      id: 'prop-carbs-boost',
      createdAt,
      title: "+40 g de glucides aujourd'hui",
      source: 'nutrition',
      action: 'adjust_nutrition_targets',
      payload: {
        macros: {
          calories: target.calories + 160,
          protein: target.protein,
          carbs: target.carbs + 40,
          fat: target.fat,
        },
      },
      status: 'pending',
      rationale: 'Fractionné demain : recharge en glycogène',
      confidence: 0.85,
      autoApply: false,
    });

    proposals.push({
      id: 'prop-usual-lunch',
      createdAt,
      title: 'Ajouter ton déjeuner habituel ?',
      source: 'nutrition',
      action: 'log_meal',
      payload: {
        meal: {
          name: 'Poulet · riz · brocolis',
          loggedAt: `${today}T12:30:00`,
          macros: { calories: 640, protein: 48, carbs: 72, fat: 14 },
          confidence: 1,
        },
      },
      status: 'pending',
      rationale: 'Tu manges souvent ce plat le midi',
      confidence: 0.78,
      autoApply: false,
    });

    return proposals;
  }
}
