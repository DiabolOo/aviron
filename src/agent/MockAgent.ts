import { addDaysISO } from '@/src/core/dates';
import type { Proposal } from '@/src/core/schemas';
import type { Meal, WorkoutSession } from '@/src/core/types';
import type {
  AdaptWeekParams,
  IAgent,
  IntentContext,
  IntentResult,
  ProposalContext,
} from '@/src/agent/types';
import { buildWeekSessions, mockAdaptWeek, mockAnalyzePlate } from '@/src/data/mock';

function nextSunday(date: string): string {
  const dow = new Date(`${date}T00:00:00`).getDay();
  return addDaysISO(date, (7 - dow) % 7 || 7);
}

const MEAL_RE = /mang|repas|déjeuner|dejeuner|dîner|diner|petit[- ]?déj|goûter|gouter/i;
const TIRED_RE = /claqu|fatigu|crev|épuis|epuis|courbatur|pas la forme/i;
const SETTINGS_RE = /r[ée]glage|param[èe]tre|profil|module/i;
const PLAN_MEALS_RE = /planifi\w*.*(semaine|repas)|menu de la semaine|courses/i;
const MOVE_RE = /décal|decal|report|dimanche/i;

export class MockAgent implements IAgent {
  async interpretIntent(
    text: string,
    { sessions, today, mealPlanSeed = 0 }: IntentContext,
  ): Promise<IntentResult> {
    const input = text.trim();
    const createdAt = new Date().toISOString();
    const id = `prop-intent-${Date.now()}`;
    const upcoming = sessions.filter((s) => !s.completed && s.date >= today);

    if (SETTINGS_RE.test(input)) {
      return { reply: 'Voici tes réglages.', proposals: [], navigateTo: '/profile' };
    }

    if (PLAN_MEALS_RE.test(input)) {
      return {
        reply: 'J’ai préparé une nouvelle semaine de repas, les chiffres sont recalculés par l’app.',
        proposals: [
          {
            id,
            createdAt,
            title: 'Planifier ma semaine de repas',
            source: 'nutrition',
            action: 'plan_week_meals',
            payload: { seed: mealPlanSeed + 1 },
            status: 'pending',
            rationale: 'Repas variés calés sur tes cibles du jour, courses déduites du plan',
            confidence: 0.82,
            autoApply: false,
            preview: { before: 'Semaine actuelle', after: 'Nouvelle semaine' },
          },
        ],
      };
    }

    if (TIRED_RE.test(input)) {
      const session = upcoming[0];
      const minutes = input.match(/(\d{2,3})\s*min/i)?.[1];
      if (!session) return { reply: 'Aucune séance à alléger : profite de ta récupération.', proposals: [] };
      return {
        reply: minutes
          ? `Compris, ${minutes} min maximum. Je te propose de reporter la séance.`
          : 'Compris. Je te propose de reporter la prochaine séance.',
        proposals: [
          {
            id,
            createdAt,
            title: `Reporter « ${session.title} » à demain`,
            source: 'coach',
            action: 'adjust_plan',
            payload: { sessionId: session.id, toDate: addDaysISO(session.date, 1) },
            status: 'pending',
            rationale: `Tu te sens fatigué : on décale d'un jour pour récupérer${minutes ? ` (${minutes} min max)` : ''}`,
            confidence: 0.8,
            autoApply: false,
            preview: { before: session.date.slice(8), after: addDaysISO(session.date, 1).slice(8) },
          },
        ],
      };
    }

    if (MOVE_RE.test(input)) {
      const session = upcoming.find((s) => s.title.toLowerCase().includes('longue')) ?? upcoming[0];
      if (!session) return { reply: 'Je ne trouve aucune séance à décaler.', proposals: [] };
      return {
        reply: 'Voici le déplacement que je te propose.',
        proposals: [
          {
            id,
            createdAt,
            title: `Décaler « ${session.title} » à dimanche`,
            source: 'coach',
            action: 'adjust_plan',
            payload: { sessionId: session.id, toDate: nextSunday(session.date) },
            status: 'pending',
            rationale: 'Demande explicite de l’utilisateur',
            confidence: 0.9,
            autoApply: false,
            preview: { before: 'Avant', after: 'Dim.' },
          },
        ],
      };
    }

    if (MEAL_RE.test(input)) {
      const moment = new Date().getHours();
      return {
        reply: 'J’ai estimé ce repas, ajuste si besoin avant de valider.',
        proposals: [
          {
            id,
            createdAt,
            title: `Ajouter « ${input.length > 40 ? `${input.slice(0, 40)}…` : input} »`,
            source: 'nutrition',
            action: 'log_meal',
            payload: {
              meal: {
                name: input.charAt(0).toUpperCase() + input.slice(1),
                loggedAt: `${today}T${String(moment).padStart(2, '0')}:00:00`,
                macros: { calories: 560, protein: 30, carbs: 62, fat: 20 },
                confidence: 0.55,
              },
            },
            status: 'pending',
            rationale: 'Estimation générique (mock) : portions moyennes',
            confidence: 0.55,
            autoApply: false,
          },
        ],
      };
    }

    return {
      reply: 'Je n’ai pas compris. Essaie « claqué, 45 min max », « j’ai mangé des pâtes » ou « décale la sortie longue ».',
      proposals: [],
    };
  }

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
