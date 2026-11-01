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

// ─── intensity_too_high ───────────────────────────────────────────────────────

export const INTENSITY_LABELS = {
  share: (minKm: number, bpm: number) => `Courses > ${minKm} km au-dessus de ${bpm} bpm`,
  maxHr: 'FC max utilisée',
  easy: 'FC conseillée pour une sortie facile',
};

export function intensityTooHighCopy(p: {
  sharePct: number;
  minKm: number;
  thresholdBpm: number;
  easyBpm: number;
  total: number;
  weeks: number;
}): InsightCopy {
  return {
    title: 'Tes sorties sont souvent trop rapides',
    beginnerText:
      'Tes sorties sont souvent un peu rapides. Ralentis sur l’une d’elles : tu dois pouvoir parler en courant.',
    athleteText: `${pct(p.sharePct)} de tes courses de plus de ${p.minKm} km dépassent ${p.thresholdBpm} bpm de moyenne (80 % de ta FC max). Fais-en une sous ${p.easyBpm} bpm.`,
    why: `Quand la plupart des sorties sont soutenues, le corps récupère moins bien et progresse moins vite. Garder une ou deux sorties vraiment faciles par semaine donne en général de meilleurs résultats. Ce constat porte sur tes ${p.total} courses de plus de ${p.minKm} km avec mesure cardiaque des ${p.weeks} dernières semaines.`,
  };
}

// ─── race_pacing ──────────────────────────────────────────────────────────────

/** 321 → « 5:21 /km » */
export const paceFr = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} /km`;

export const PACING_LABELS = {
  firstHalf: 'Allure 1re moitié',
  secondHalf: 'Allure 2e moitié',
  firstQuarter: 'Allure 1er quart',
  average: 'Allure moyenne',
  gapHalves: 'Écart 2e moitié vs 1re',
  gapQuarter: 'Écart 1er quart vs moyenne',
};

export function fastStartCopy(p: { gapPct: number; firstPaceSec: number; secondPaceSec: number; evenPaceSec: number }): InsightCopy {
  return {
    title: 'Ton départ était un peu trop rapide',
    beginnerText:
      'Tu as démarré un peu vite : la deuxième moitié de ta course a été plus lente. Au prochain départ, retiens-toi sur les premiers kilomètres.',
    athleteText: `Ta 2e moitié est ${pct(p.gapPct, 1)} plus lente que la 1re (${paceFr(p.secondPaceSec)} contre ${paceFr(p.firstPaceSec)}). Vise ${paceFr(p.evenPaceSec)} dès le départ.`,
    why: 'Un départ trop rapide se paie souvent sur la fin : le rythme baisse quand la fatigue arrive. Répartir l’effort de façon régulière donne en général un meilleur chrono. Cet écart est mesuré sur les temps de passage kilomètre par kilomètre de ta course.',
  };
}

export function cautiousStartCopy(p: { gapPct: number; firstQuarterPaceSec: number; averagePaceSec: number }): InsightCopy {
  return {
    title: 'Ton départ était peut-être trop prudent',
    beginnerText:
      'Tu as démarré tranquillement, plus lentement que le reste de ta course. Au prochain départ, accélère un peu plus tôt, dès le deuxième kilomètre.',
    athleteText: `Ton 1er quart est ${pct(p.gapPct, 1)} plus lent que ta moyenne (${paceFr(p.firstQuarterPaceSec)} contre ${paceFr(p.averagePaceSec)}). Passe à ${paceFr(p.averagePaceSec)} dès le 2e km.`,
    why: 'Partir un peu plus doucement que sa moyenne est souvent judicieux, mais ici l’écart dépasse 5 %. Il peut laisser des forces inutilisées en fin de course. À toi de voir si c’était voulu (foule, côte au départ).',
  };
}
