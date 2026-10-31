import { addDaysISO } from './dates';
import type { AthleticGoal, AthleticGoalType } from './types';

export const OBJECTIVE_MODELS: { label: string; text: string }[] = [
  { label: 'Prépa course', text: 'Semi-marathon en 1h45 dans 10 semaines, 4 séances par semaine' },
  { label: 'Gain de force', text: 'Prendre de la force, 3 séances de muscu par semaine' },
  { label: 'Endurance', text: 'Courir 1 h sans m’arrêter, 3 séances par semaine' },
  { label: 'Entretien / santé', text: 'Rester actif, 3 séances par semaine sans pression' },
];

function detectType(text: string): AthleticGoalType {
  if (/semi|marathon|\b(5|10|15|20)\s*km|course|trail/.test(text)) return 'race_prep';
  if (/force|muscu|muscle|dco|squat|soulev/.test(text)) return 'muscle_strength';
  if (/endurance|tenir|sans (m.)?arr[êe]ter/.test(text)) return 'endurance';
  return 'fitness';
}

function detectTarget(text: string, type: AthleticGoalType): string {
  if (/marathon/.test(text) && !/semi/.test(text)) return 'Marathon';
  if (/semi/.test(text)) return 'Semi-marathon';
  const km = text.match(/\b(\d{1,2})\s*km/);
  if (km) return `${km[1]} km`;
  const fallback: Record<AthleticGoalType, string> = {
    race_prep: 'Course',
    muscle_strength: 'Prise de force',
    endurance: 'Endurance',
    fitness: 'Remise en forme',
  };
  return fallback[type];
}

export function parseObjective(input: string, today: string): AthleticGoal | null {
  const text = input.trim().toLowerCase();
  if (text.length < 3) return null;
  const type = detectType(text);
  const sessions = Number(text.match(/(\d)\s*s[ée]ances/)?.[1] ?? 3);
  const weeks = Number(text.match(/(\d{1,2})\s*semaines/)?.[1] ?? 0);
  const value = text.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/);
  return {
    type,
    targetName: detectTarget(text, type),
    targetValue: value ? `${value[1]}h${value[2] ?? ''}` : undefined,
    targetDate: weeks > 0 ? addDaysISO(today, weeks * 7) : undefined,
    weeklySessionsCount: Math.min(7, Math.max(1, sessions)),
  };
}
