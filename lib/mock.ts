import { toISODate, weekDates } from '@/lib/dates';
import type { Meal, UserProfile, WorkoutSession } from '@/lib/types';

export const MOCK_PROFILE: UserProfile = {
  firstName: 'Alex',
  goalLabel: 'Prépa semi-marathon · 1h45',
  calorieTarget: 2650,
  macrosTarget: {
    calories: 2650,
    protein: 160,
    carbs: 320,
    fat: 75,
  },
};

function dated(offsetFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetFromToday);
  return toISODate(date);
}

export function buildWeekSessions(): WorkoutSession[] {
  const days = weekDates();

  const templates: Omit<WorkoutSession, 'id' | 'date'>[] = [
    {
      title: 'Footing recovery',
      kind: 'run',
      subtitle: '8 km · Allure 6:00',
      durationMin: 48,
      caloriesBurn: 520,
      completed: true,
      blocks: [
        { id: 'm0-1', title: 'Échauffement', detail: '12 min easy + éducatifs', durationMin: 12 },
        { id: 'm0-2', title: 'Endurance fondamentale', detail: '30 min à 6:00/km', durationMin: 30 },
        { id: 'm0-3', title: 'Retour au calme', detail: '6 min + étirements', durationMin: 6 },
      ],
    },
    {
      title: 'Séance Push muscu',
      kind: 'strength',
      subtitle: 'Pecs · Épaules · Triceps',
      durationMin: 55,
      caloriesBurn: 380,
      completed: true,
      exercises: [
        { id: 's1-1', name: 'Développé haltères', sets: 4, reps: '8-10', restSec: 90 },
        { id: 's1-2', name: 'Développé militaire', sets: 3, reps: '10', restSec: 75 },
        { id: 's1-3', name: 'Écartés poulie', sets: 3, reps: '12', restSec: 60 },
        { id: 's1-4', name: 'Dips assistés', sets: 3, reps: '10', restSec: 75 },
      ],
    },
    {
      title: 'VMA courtes',
      kind: 'run',
      subtitle: '10 x 400 m · Récup 200 m',
      durationMin: 50,
      caloriesBurn: 610,
      completed: false,
      blocks: [
        { id: 'm2-1', title: 'Échauffement', detail: '15 min easy + 4 lignes droites', durationMin: 15 },
        { id: 'm2-2', title: 'VMA', detail: '10 x 400 m @ 3:50/km · récup 200 m trot', durationMin: 28 },
        { id: 'm2-3', title: 'Retour au calme', detail: '7 min easy', durationMin: 7 },
      ],
    },
    {
      title: 'Pull + Core',
      kind: 'strength',
      subtitle: 'Dos · Biceps · Gainage',
      durationMin: 50,
      caloriesBurn: 360,
      completed: false,
      exercises: [
        { id: 's3-1', name: 'Tractions pronation', sets: 4, reps: '6-8', restSec: 120 },
        { id: 's3-2', name: 'Rowing haltère', sets: 3, reps: '10', restSec: 75 },
        { id: 's3-3', name: 'Curl barre EZ', sets: 3, reps: '12', restSec: 60 },
        { id: 's3-4', name: 'Planche + hollow', sets: 3, reps: '40 s', restSec: 45 },
      ],
    },
    {
      title: 'Sortie longue',
      kind: 'run',
      subtitle: '10 km · Allure 5:30',
      durationMin: 58,
      caloriesBurn: 740,
      completed: false,
      blocks: [
        { id: 'm4-1', title: 'Mise en route', detail: '2 km à 6:10/km', durationMin: 12 },
        { id: 'm4-2', title: 'Bloc spécifique', detail: '7 km à 5:30/km', durationMin: 39 },
        { id: 'm4-3', title: 'Cool down', detail: '1 km easy + mobilité', durationMin: 7 },
      ],
    },
    {
      title: 'Jambes force',
      kind: 'strength',
      subtitle: 'Squat · Fentes · Mollets',
      durationMin: 60,
      caloriesBurn: 430,
      completed: false,
      exercises: [
        { id: 's5-1', name: 'Back squat', sets: 5, reps: '5', restSec: 150 },
        { id: 's5-2', name: 'Fentes marchées', sets: 3, reps: '10/jambe', restSec: 90 },
        { id: 's5-3', name: 'Hip thrust', sets: 3, reps: '12', restSec: 75 },
        { id: 's5-4', name: 'Mollets debout', sets: 4, reps: '15', restSec: 45 },
      ],
    },
    {
      title: 'Récupération active',
      kind: 'rest',
      subtitle: 'Marche 30 min · Mobilité',
      durationMin: 35,
      caloriesBurn: 160,
      completed: false,
      blocks: [
        { id: 'm6-1', title: 'Marche', detail: 'Zone 1, respiration nasale', durationMin: 30 },
        { id: 'm6-2', title: 'Mobilité', detail: 'Hanches, chevilles, thoracic', durationMin: 5 },
      ],
    },
  ];

  return days.map((date, index) => ({
    ...templates[index],
    id: `session-${date}`,
    date,
    completed: templates[index].completed && date <= dated(0),
  }));
}

export const MOCK_MEALS: Meal[] = [
  {
    id: 'meal-breakfast',
    name: 'Bowl skyr · granola · myrtilles',
    loggedAt: `${dated(0)}T07:40:00`,
    confidence: 0.91,
    macros: { calories: 420, protein: 32, carbs: 48, fat: 12 },
  },
  {
    id: 'meal-lunch',
    name: 'Poulet · riz · brocolis',
    loggedAt: `${dated(0)}T12:35:00`,
    confidence: 0.88,
    macros: { calories: 640, protein: 48, carbs: 72, fat: 14 },
  },
];

const SCAN_PRESETS: Omit<Meal, 'id' | 'loggedAt' | 'photoUri'>[] = [
  {
    name: 'Poulet grillé · riz basmati · brocolis',
    confidence: 0.87,
    macros: { calories: 612, protein: 46, carbs: 68, fat: 14 },
  },
  {
    name: 'Saumon · quinoa · haricots verts',
    confidence: 0.84,
    macros: { calories: 705, protein: 42, carbs: 54, fat: 32 },
  },
  {
    name: 'Pâtes bolognaise · parmesan',
    confidence: 0.81,
    macros: { calories: 780, protein: 34, carbs: 92, fat: 26 },
  },
  {
    name: 'Omelette · avocat · pain complet',
    confidence: 0.9,
    macros: { calories: 540, protein: 28, carbs: 32, fat: 34 },
  },
];

export async function mockAnalyzePlate(photoUri: string): Promise<Meal> {
  await new Promise((resolve) => setTimeout(resolve, 1800));
  const pick = SCAN_PRESETS[Math.floor(Math.random() * SCAN_PRESETS.length)];
  return {
    ...pick,
    id: `scan-${Date.now()}`,
    loggedAt: new Date().toISOString(),
    photoUri,
  };
}

export async function mockAdaptWeek(params: {
  fatigue: 'fresh' | 'ok' | 'tired';
  timeBudget: '30' | '45' | '60' | '90';
  sessions: WorkoutSession[];
}): Promise<WorkoutSession[]> {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  const volumeFactor =
    params.fatigue === 'tired' ? 0.72 : params.fatigue === 'ok' ? 0.9 : 1;
  const timeCap = Number(params.timeBudget);

  return params.sessions.map((session) => {
    if (session.kind === 'rest' || session.completed) return session;
    const durationMin = Math.max(25, Math.round(Math.min(session.durationMin, timeCap) * volumeFactor));
    const caloriesBurn = Math.round(session.caloriesBurn * (durationMin / session.durationMin));
    const subtitle =
      params.fatigue === 'tired'
        ? `${session.subtitle.split('·')[0].trim()} · volume réduit`
        : session.subtitle;

    return {
      ...session,
      durationMin,
      caloriesBurn,
      subtitle,
      title: params.fatigue === 'tired' && session.kind === 'run' ? `${session.title} (adapté)` : session.title,
    };
  });
}
