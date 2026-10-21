import { toISODate, weekDates } from '@/lib/dates';
import type {
  Meal,
  Recipe,
  StravaActivity,
  UserProfile,
  Weather,
  WorkoutSession,
} from '@/lib/types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'recipe-bowl-poulet',
    title: 'Bowl Poulet-Patate Douce',
    calories: 620,
    protein: 45,
    carbs: 68,
    fat: 16,
    prepTimeMinutes: 25,
    category: 'muscle_gain',
    ingredients: [
      { name: 'Blanc de poulet', quantity: '150 g' },
      { name: 'Patate douce', quantity: '200 g' },
      { name: 'Brocoli', quantity: '100 g' },
      { name: "Huile d'olive", quantity: '1 c. à c.' },
    ],
    isFavorite: true,
  },
  {
    id: 'recipe-omelette',
    title: 'Omelette Protéinée',
    calories: 380,
    protein: 32,
    carbs: 6,
    fat: 25,
    prepTimeMinutes: 10,
    category: 'quick',
    ingredients: [
      { name: 'Oeufs', quantity: '3' },
      { name: 'Blancs d’oeuf', quantity: '2' },
      { name: 'Épinards', quantity: '50 g' },
      { name: 'Fromage frais', quantity: '30 g' },
    ],
  },
  {
    id: 'recipe-soupe-recup',
    title: 'Soupe Récupération Légumes',
    calories: 210,
    protein: 8,
    carbs: 32,
    fat: 5,
    prepTimeMinutes: 30,
    category: 'recovery',
    ingredients: [
      { name: 'Carottes', quantity: '200 g' },
      { name: 'Courgette', quantity: '150 g' },
      { name: 'Pommes de terre', quantity: '100 g' },
      { name: 'Bouillon', quantity: '400 ml' },
    ],
  },
  {
    id: 'recipe-smoothie-avoine',
    title: 'Smoothie Avoine-Banane',
    calories: 340,
    protein: 14,
    carbs: 58,
    fat: 6,
    prepTimeMinutes: 5,
    category: 'quick',
    ingredients: [
      { name: "Flocons d'avoine", quantity: '50 g' },
      { name: 'Banane', quantity: '1' },
      { name: 'Lait', quantity: '250 ml' },
    ],
  },
  {
    id: 'recipe-pates-thon',
    title: 'Pâtes Complètes Thon-Tomate',
    calories: 680,
    protein: 42,
    carbs: 95,
    fat: 12,
    prepTimeMinutes: 20,
    category: 'recovery',
    ingredients: [
      { name: 'Pâtes complètes', quantity: '100 g (cru)' },
      { name: 'Thon au naturel', quantity: '120 g' },
      { name: 'Sauce tomate', quantity: '150 g' },
    ],
  },
  {
    id: 'recipe-skyr-bowl',
    title: 'Bowl Skyr Fruits Rouges',
    calories: 290,
    protein: 28,
    carbs: 34,
    fat: 4,
    prepTimeMinutes: 5,
    category: 'weight_loss',
    ingredients: [
      { name: 'Skyr', quantity: '200 g' },
      { name: 'Fruits rouges', quantity: '100 g' },
      { name: 'Granola', quantity: '20 g' },
    ],
  },
  {
    id: 'recipe-saumon-quinoa',
    title: 'Saumon Quinoa Légumes',
    calories: 590,
    protein: 38,
    carbs: 48,
    fat: 25,
    prepTimeMinutes: 25,
    category: 'recovery',
    ingredients: [
      { name: 'Pavé de saumon', quantity: '140 g' },
      { name: 'Quinoa', quantity: '80 g (cru)' },
      { name: 'Haricots verts', quantity: '150 g' },
    ],
  },
  {
    id: 'recipe-salade-poulet',
    title: 'Salade Poulet Croquante',
    calories: 360,
    protein: 38,
    carbs: 18,
    fat: 14,
    prepTimeMinutes: 15,
    category: 'weight_loss',
    ingredients: [
      { name: 'Poulet', quantity: '130 g' },
      { name: 'Salade verte', quantity: '100 g' },
      { name: 'Concombre', quantity: '1/2' },
      { name: 'Vinaigrette légère', quantity: '1 c. à s.' },
    ],
  },
  {
    id: 'recipe-pancakes-whey',
    title: 'Pancakes Avoine-Whey',
    calories: 450,
    protein: 35,
    carbs: 52,
    fat: 11,
    prepTimeMinutes: 15,
    category: 'muscle_gain',
    ingredients: [
      { name: "Flocons d'avoine", quantity: '60 g' },
      { name: 'Whey vanille', quantity: '30 g' },
      { name: 'Oeuf', quantity: '1' },
      { name: 'Banane', quantity: '1/2' },
    ],
  },
  {
    id: 'recipe-riz-boeuf',
    title: 'Riz Boeuf Haché Poivrons',
    calories: 720,
    protein: 48,
    carbs: 80,
    fat: 20,
    prepTimeMinutes: 20,
    category: 'muscle_gain',
    ingredients: [
      { name: 'Boeuf haché 5%', quantity: '150 g' },
      { name: 'Riz basmati', quantity: '90 g (cru)' },
      { name: 'Poivrons', quantity: '150 g' },
    ],
  },
];

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
  weightKg: 74.5,
  targetWeightKg: 72,
};

export const MOCK_WEATHER: Weather = {
  city: 'Lyon',
  tempC: 14,
  condition: 'partly',
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
  {
    id: 'meal-snack',
    name: 'Banane · amandes',
    loggedAt: `${dated(0)}T16:10:00`,
    confidence: 0.93,
    macros: { calories: 260, protein: 7, carbs: 32, fat: 12 },
  },
];

type ActivitySeed = Pick<
  StravaActivity,
  'id' | 'name' | 'type' | 'distanceKm' | 'movingTimeMin' | 'elevationM' | 'startTime'
> & { offset: number; avgHr: number; calories: number; seed: number };

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function paceLabel(sec: number): string {
  return `${Math.floor(sec / 60)}:${`${Math.round(sec % 60)}`.padStart(2, '0')}`;
}

function buildActivity(seed: ActivitySeed): StravaActivity {
  const rand = seededRandom(seed.seed);
  const avgPaceSec = (seed.movingTimeMin * 60) / seed.distanceKm;
  const fullKm = Math.floor(seed.distanceKm);
  const lastKm = seed.distanceKm - fullKm;
  const count = fullKm + (lastKm >= 0.1 ? 1 : 0);

  const splits = Array.from({ length: count }, (_, i) => {
    const wave = Math.sin((i / Math.max(1, count - 1)) * Math.PI * 2) * 0.03;
    const fade = (i / Math.max(1, count)) * 0.02;
    const paceSec = Math.round(avgPaceSec * (1 + wave + fade + (rand() - 0.5) * 0.08));
    return {
      km: i + 1,
      paceSec,
      pace: paceLabel(paceSec),
      elevationGain: Math.round((seed.elevationM / count) * (0.4 + rand() * 1.2)),
      avgHr: Math.round(seed.avgHr - 8 + (i / Math.max(1, count)) * 14 + (rand() - 0.5) * 6),
    };
  });

  const points = Math.max(40, Math.round(seed.movingTimeMin * 1.2));
  const hrStream = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const warmup = Math.min(1, t / 0.12);
    return Math.round(
      seed.avgHr - 14 + warmup * 12 + t * 12 + Math.sin(t * Math.PI * 6) * 4 + (rand() - 0.5) * 4,
    );
  });

  const polyline = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 59) * Math.PI * 2;
    const r = 1 + 0.28 * Math.sin(a * 3 + seed.seed) + 0.12 * Math.cos(a * 2);
    return { x: 0.5 + 0.5 * r * Math.cos(a) * 0.8, y: 0.5 + 0.5 * r * Math.sin(a) * 0.7 };
  });

  return {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    date: dated(seed.offset),
    startTime: seed.startTime,
    distanceKm: seed.distanceKm,
    movingTimeMin: seed.movingTimeMin,
    elevationM: seed.elevationM,
    calories: seed.calories,
    avgHr: Math.round(hrStream.reduce((s, v) => s + v, 0) / hrStream.length),
    maxHr: Math.max(...hrStream),
    splits,
    hrStream,
    polyline,
  };
}

export function buildStravaActivities(): StravaActivity[] {
  const seeds: ActivitySeed[] = [
    { id: 'act-1', name: 'Footing recovery', type: 'run', offset: -1, startTime: '07:15', distanceKm: 8.1, movingTimeMin: 48, elevationM: 42, avgHr: 142, calories: 520, seed: 11 },
    { id: 'act-2', name: 'Vélotaf', type: 'ride', offset: -2, startTime: '08:05', distanceKm: 18.4, movingTimeMin: 46, elevationM: 120, avgHr: 128, calories: 430, seed: 23 },
    { id: 'act-3', name: 'Sortie longue', type: 'run', offset: -4, startTime: '09:30', distanceKm: 16.2, movingTimeMin: 92, elevationM: 135, avgHr: 152, calories: 1080, seed: 37 },
    { id: 'act-4', name: 'Fractionné 6 x 1000', type: 'run', offset: -6, startTime: '18:40', distanceKm: 11.0, movingTimeMin: 55, elevationM: 38, avgHr: 164, calories: 760, seed: 41 },
    { id: 'act-5', name: 'Marche active', type: 'walk', offset: -7, startTime: '12:20', distanceKm: 5.3, movingTimeMin: 62, elevationM: 25, avgHr: 112, calories: 290, seed: 53 },
  ];
  return seeds.map(buildActivity);
}

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
    loggedAt: `${toISODate(new Date())}T${new Date().toTimeString().slice(0, 8)}`,
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
