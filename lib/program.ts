import { addDaysISO, parseISODate, startOfWeek, toISODate, weekDates } from '@/lib/dates';
import { uid } from '@/lib/format';
import type {
  AthleticGoal,
  ProgramMilestone,
  WorkoutProgram,
  WorkoutSession,
} from '@/lib/types';

const DAY_SLOTS: Record<number, number[]> = {
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

type Template = Pick<WorkoutSession, 'title' | 'kind' | 'subtitle' | 'durationMin' | 'caloriesBurn'> &
  Partial<Pick<WorkoutSession, 'blocks' | 'exercises'>>;

function runBlocks(prefix: string, main: string, mainMin: number): WorkoutSession['blocks'] {
  return [
    { id: `${prefix}-1`, title: 'Échauffement', detail: '10 min easy + éducatifs', durationMin: 10 },
    { id: `${prefix}-2`, title: 'Corps de séance', detail: main, durationMin: mainMin },
    { id: `${prefix}-3`, title: 'Retour au calme', detail: '5 min + étirements', durationMin: 5 },
  ];
}

function strengthTemplate(title: string, subtitle: string, names: [string, number, string][]): Template {
  return {
    title,
    kind: 'strength',
    subtitle,
    durationMin: 55,
    caloriesBurn: 380,
    exercises: names.map(([name, sets, reps], i) => ({
      id: `${title}-${i}`,
      name,
      sets,
      reps,
      restSec: 75,
    })),
  };
}

const STRENGTH_ROTATION: Template[] = [
  strengthTemplate('Push', 'Pecs · Épaules · Triceps', [
    ['Développé couché', 4, '6-8'],
    ['Développé militaire', 3, '8-10'],
    ['Dips assistés', 3, '10'],
  ]),
  strengthTemplate('Pull', 'Dos · Biceps', [
    ['Tractions', 4, '6-8'],
    ['Rowing barre', 3, '8-10'],
    ['Curl haltères', 3, '12'],
  ]),
  strengthTemplate('Legs', 'Jambes · Gainage', [
    ['Squat', 4, '6-8'],
    ['Soulevé de terre roumain', 3, '8-10'],
    ['Fentes marchées', 3, '12'],
  ]),
  strengthTemplate('Full body', 'Ensemble du corps', [
    ['Développé couché', 3, '8'],
    ['Squat', 3, '8'],
    ['Rowing barre', 3, '8'],
  ]),
];

const RUN_ROTATION: Template[] = [
  {
    title: 'Footing endurance',
    kind: 'run',
    subtitle: '8 km · Allure facile',
    durationMin: 48,
    caloriesBurn: 520,
    blocks: runBlocks('r1', '30 min en endurance fondamentale', 30),
  },
  {
    title: 'Fractionné',
    kind: 'run',
    subtitle: '8 x 400 m · Récup 200 m',
    durationMin: 45,
    caloriesBurn: 580,
    blocks: runBlocks('r2', '8 x 400 m rapides, récup 200 m trot', 25),
  },
  {
    title: 'Sortie longue',
    kind: 'run',
    subtitle: '12 km · Allure confortable',
    durationMin: 75,
    caloriesBurn: 820,
    blocks: runBlocks('r3', '60 min à allure confortable', 60),
  },
  {
    title: 'Allure spécifique',
    kind: 'run',
    subtitle: '3 x 10 min · Allure objectif',
    durationMin: 55,
    caloriesBurn: 640,
    blocks: runBlocks('r4', '3 x 10 min à allure objectif, récup 3 min', 40),
  },
];

const FITNESS_ROTATION: Template[] = [
  RUN_ROTATION[0],
  STRENGTH_ROTATION[3],
  { ...RUN_ROTATION[1], title: 'Intervalles légers', subtitle: '6 x 1 min vif' },
  STRENGTH_ROTATION[2],
];

function rotationFor(goal: AthleticGoal): Template[] {
  switch (goal.type) {
    case 'muscle_strength':
      return STRENGTH_ROTATION;
    case 'fitness':
      return FITNESS_ROTATION;
    case 'endurance':
    case 'race_prep':
    default:
      return RUN_ROTATION;
  }
}

export function buildProgramSessions(goal: AthleticGoal, anchor: Date = new Date()): WorkoutSession[] {
  const count = Math.min(6, Math.max(2, goal.weeklySessionsCount));
  const slots = DAY_SLOTS[count];
  const rotation = rotationFor(goal);
  const dates = weekDates(anchor);
  const today = toISODate(anchor);
  let cursor = 0;

  return dates.map((date, dayIndex) => {
    const slot = slots.includes(dayIndex);
    if (!slot) {
      return {
        id: uid('session'),
        date,
        title: 'Repos',
        kind: 'rest',
        subtitle: 'Récupération active',
        durationMin: 0,
        caloriesBurn: 0,
        completed: date < today,
      } satisfies WorkoutSession;
    }
    const template = rotation[cursor % rotation.length];
    cursor += 1;
    return { ...template, id: uid('session'), date, completed: false } satisfies WorkoutSession;
  });
}

const DEFAULT_WEEKS = 8;

export function buildProgram(goal: AthleticGoal, now: Date = new Date()): WorkoutProgram {
  const start = toISODate(startOfWeek(now));
  const rawWeeks = goal.targetDate
    ? Math.ceil((parseISODate(goal.targetDate).getTime() - parseISODate(start).getTime()) / (7 * 86400000))
    : DEFAULT_WEEKS;
  const totalWeeks = Math.min(24, Math.max(2, rawWeeks));
  const endDate = goal.targetDate ?? addDaysISO(start, totalWeeks * 7 - 1);

  const milestoneDefs: [number, string][] = [
    [Math.max(1, Math.round(totalWeeks * 0.25)), 'Base solide'],
    [Math.max(2, Math.round(totalWeeks * 0.5)), 'Montée en charge'],
    [Math.max(3, Math.round(totalWeeks * 0.75)), 'Pic de forme'],
  ];
  const milestones: ProgramMilestone[] = milestoneDefs
    .filter(([week]) => week < totalWeeks)
    .map(([week, title]) => ({
      id: uid('ms'),
      title,
      weekIndex: week,
      date: addDaysISO(start, week * 7),
    }));
  milestones.push({
    id: uid('ms'),
    title: goal.targetName,
    weekIndex: totalWeeks,
    date: endDate,
  });

  return {
    id: uid('program'),
    createdAt: now.toISOString(),
    goal,
    startDate: start,
    endDate,
    totalWeeks,
    milestones,
  };
}
