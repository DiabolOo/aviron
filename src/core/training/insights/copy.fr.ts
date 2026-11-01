import type { InsightCopy } from './types';

// Gabarits de textes (français, tutoiement, sans diagnostic ni ton culpabilisant).
// Les chiffres sont fournis par l'engine : on ne recalcule rien ici.

export const nf = (n: number, digits = 0): string => n.toFixed(digits).replace('.', ',');
export const pct = (n: number, digits = 0): string => `${nf(n, digits)} %`;
export const km = (n: number, digits = 1): string => `${nf(n, digits)} km`;

export const quarterLabel = (key: string): string => {
  const [year, q] = key.split('-Q');
  return `T${q} ${year}`;
};

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** YYYY-MM-DD → « 3 juin 2026 » */
export const dateFr = (date: string): string => {
  const [y, m, d] = date.split('-').map(Number);
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`;
};

// ─── data_quality_no_hr ───────────────────────────────────────────────────────

export const EVIDENCE_LABELS = {
  noHrMissing: (window: number) => `Courses sans FC (${window} dernières)`,
  noHrStreak: 'Courses d’affilée sans FC',
};

export function dataQualityNoHrCopy(p: { missing: number; window: number; streak: number; since: string }): InsightCopy {
  const athlete =
    p.streak >= p.missing
      ? `${p.streak} courses d’affilée sans FC depuis le ${dateFr(p.since)} (${p.missing} des ${p.window} dernières). Active l’enregistrement cardiaque sur ta montre.`
      : `${p.missing} de tes ${p.window} dernières courses n’ont pas de FC. Active l’enregistrement cardiaque sur ta montre.`;
  return {
    title: 'Tes courses n’ont pas de mesure cardiaque',
    beginnerText: 'Tes dernières sorties n’ont pas de mesure du cœur. Active-la sur ta montre pour que je puisse mieux t’aider.',
    athleteText: athlete,
    why: 'Sans fréquence cardiaque, je ne peux pas juger si tes sorties sont assez faciles ni suivre ta progression. Les conseils d’intensité et de tendance restent donc muets tant que la mesure manque. Tes distances et tes temps, eux, sont bien pris en compte.',
  };
}
