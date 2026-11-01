import type { InsightCopy } from './types';

// Gabarits de textes (français, tutoiement, sans diagnostic ni ton culpabilisant, neutres : pas de « je »).
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

const plural = (n: number, word: string): string => `${n} ${word}${n > 1 ? 's' : ''}`;

/** 321 → « 5:21 /km » */
export const paceFr = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} /km`;

// ─── data_quality_no_hr ───────────────────────────────────────────────────────

export const EVIDENCE_LABELS = {
  noHrMissing: (window: number) => `Courses sans FC (${window} dernières)`,
  noHrStreak: 'Courses sans FC depuis la dernière mesure',
};

export function dataQualityNoHrCopy(p: { missing: number; window: number; streak: number; since: string }): InsightCopy {
  const athlete =
    p.streak >= p.missing
      ? `${p.streak} courses sans FC depuis le ${dateFr(p.since)}. Active l’enregistrement sur ta montre ou ton capteur cardiaque.`
      : `${p.missing} de tes ${p.window} dernières courses sont sans FC. Active l’enregistrement sur ta montre ou ton capteur cardiaque.`;
  return {
    title: 'Tes courses n’ont pas de mesure cardiaque',
    beginnerText: 'Tes dernières sorties n’ont pas de mesure du cœur. Active-la sur ta montre ou ton capteur cardiaque pour suivre tes progrès.',
    athleteText: athlete,
    why: 'Sans fréquence cardiaque, impossible de juger si tes sorties sont assez faciles ni de suivre ta progression. Les conseils d’intensité et de tendance restent donc muets tant que la mesure manque. Tes distances et tes temps, eux, sont bien pris en compte.',
  };
}

// ─── intensity_too_high ───────────────────────────────────────────────────────

export const INTENSITY_LABELS = {
  share: (minKm: number, bpm: number) => `Courses > ${minKm} km au-dessus de ${bpm} bpm`,
  maxHr: (approx: boolean) => (approx ? 'FC max utilisée (estimée)' : 'FC max utilisée'),
  easy: 'FC conseillée pour une sortie facile',
};

export function intensityTooHighCopy(p: {
  sharePct: number;
  minKm: number;
  thresholdBpm: number;
  easyBpm: number;
  total: number;
  weeks: number;
  /** FC max estimée : les bpm sont précédés de « environ » */
  approx: boolean;
}): InsightCopy {
  const about = p.approx ? 'environ ' : '';
  return {
    title: 'Tes sorties sont souvent trop rapides',
    beginnerText:
      'Tes sorties sont souvent un peu rapides. Ralentis sur l’une d’elles : tu dois pouvoir parler en courant.',
    athleteText: `${pct(p.sharePct)} de tes courses de plus de ${p.minKm} km dépassent ${about}${p.thresholdBpm} bpm de moyenne (80 % de ta FC max${p.approx ? ' estimée' : ''}). Fais-en une sous ${about}${p.easyBpm} bpm.`,
    why: `Quand la plupart des sorties sont soutenues, le corps récupère moins bien et progresse moins vite. Garder une ou deux sorties vraiment faciles par semaine donne en général de meilleurs résultats. Ce constat porte sur tes ${p.total} courses de plus de ${p.minKm} km avec mesure cardiaque des ${p.weeks} dernières semaines.`,
  };
}

// ─── confirm_race ─────────────────────────────────────────────────────────────

export const CONFIRM_LABELS = {
  distance: 'Distance de la sortie',
  daysAgo: 'Jours depuis la sortie',
};

export function confirmRaceCopy(p: { distanceKm: number; date: string }): InsightCopy {
  return {
    title: 'C’était une course ?',
    beginnerText: `Ta sortie du ${dateFr(p.date)} (${km(p.distanceKm)}) ressemble à une course : confirme-la pour obtenir ton débrief.`,
    athleteText: `Sortie du ${dateFr(p.date)} : ${km(p.distanceKm)}, une distance de course. Confirme-la pour débloquer le débrief d’allure.`,
    why: 'La distance de cette sortie correspond à une course habituelle. Sans ta confirmation, ni débrief d’allure ni bilan de préparation ne sont calculés. Tu peux aussi l’écarter si c’était un simple entraînement.',
  };
}

/** Note du débrief : distance mesurée (trace) contre distance officielle — une ligne + un détail derrière le (i). */
export function distanceNoteFr(p: { measuredKm: number; officialKm: number; gapPct: number }): { short: string; detail: string } {
  const sign = p.gapPct > 0 ? '+' : '−';
  return {
    short: `Mesurée ${km(p.measuredKm, 2)} (${sign}${nf(Math.abs(p.gapPct), 1)} %)`,
    detail: `Distance mesurée : ${km(p.measuredKm, 2)} contre ${km(p.officialKm, 2)} officiels. L’allure officielle est calculée sur la distance officielle ; l’écart vient de la trajectoire et de la précision du GPS.`,
  };
}

/** Écart minimal de FC (bpm) entre les deux moitiés pour parler d'endurance. */
export const DRIFT_HR_BPM = 5;
/** Ralentissement minimal (s/km) pour parler de fatigue musculaire quand la FC est stable. */
export const DRIFT_PACE_SEC = 3;

/** Phrase de lecture de la dérive cardiaque ; undefined si ni l'un ni l'autre cas ne s'applique. */
export function driftSentenceFr(d: { hrBpm: number; paceSecPerKm: number }): string | undefined {
  if (d.hrBpm >= DRIFT_HR_BPM) return `Ta FC a grimpé de ${d.hrBpm} bpm en 2e moitié : ton endurance a été le facteur limitant.`;
  if (d.paceSecPerKm >= DRIFT_PACE_SEC) {
    return `Ta FC est restée stable alors que tu as ralenti de ${d.paceSecPerKm} s/km : plutôt de la fatigue musculaire qu’un effort trop intense.`;
  }
  return undefined;
}

/** Lignes ajoutées à la carte race_pacing. */
export function pacingExtrasFr(p: { longestRunKm?: number; neededPaceSec?: number; targetValue?: string }): string[] {
  const lines: string[] = [];
  if (p.longestRunKm !== undefined) lines.push(`Plus longue sortie des 8 semaines avant la course : ${km(p.longestRunKm)}.`);
  if (p.neededPaceSec !== undefined) {
    lines.push(`Allure nécessaire pour ton objectif${p.targetValue ? ` (${p.targetValue})` : ''} : ${paceFr(p.neededPaceSec)}.`);
  }
  return lines;
}

// ─── race_pacing ──────────────────────────────────────────────────────────────

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
    why: 'Partir un peu plus doucement que sa moyenne est souvent judicieux, mais ici l’écart dépasse 5 %. La foule du départ ou une côte peuvent l’expliquer, et ce n’est pas un problème en soi. Si ce n’était pas voulu, il restait de la marge pour accélérer plus tôt.',
  };
}

// ─── race_prep ────────────────────────────────────────────────────────────────

export const PREP_LABELS = {
  longest: (weeks: number) => `Plus longue sortie (${weeks} sem.)`,
  share: 'Part de la distance de course',
  total: (weeks: number) => `Volume sur ${weeks} semaines`,
  race: 'Distance de course',
  weeksLeft: 'Semaines avant la course',
  daysLeft: 'Jours avant la course',
  targetPace: 'Allure visée',
};

const PREP_TITLE = 'Ta sortie longue est courte pour cette course';
const prepWhy = (tail: string) =>
  `Les sorties longues habituent le corps à tenir la durée de la course. En dessous de 60 % de la distance, la fin de course peut devenir plus difficile. ${tail}`;

interface PrepNumbers {
  longestKm: number;
  raceKm: number;
  sharePct: number;
  weeks: number;
}

/** > 10 jours et +10 % par semaine suffit pour atteindre 60 % de la distance. */
export function racePrepReachableCopy(p: PrepNumbers & { weeksLeft: number; nextKm: number }): InsightCopy {
  return {
    title: PREP_TITLE,
    beginnerText: `Ta plus longue sortie récente fait ${km(p.longestKm)} pour une course de ${km(p.raceKm)}. Rallonge-la de 10 % chaque semaine, soit ${km(p.nextKm)} la semaine prochaine.`,
    athleteText: `Plus longue sortie des ${p.weeks} dernières semaines : ${km(p.longestKm)}, soit ${pct(p.sharePct)} des ${km(p.raceKm)} de la course (seuil : 60 %). Passe à ${km(p.nextKm)} la semaine prochaine (+10 %).`,
    why: prepWhy(`Avec +10 % par semaine, il te reste assez de temps (${plural(p.weeksLeft, 'semaine')}) pour atteindre ce repère.`),
  };
}

/** > 10 jours mais +10 % par semaine ne suffit plus. */
export function racePrepShortCopy(p: PrepNumbers & { weeksLeft: number }): InsightCopy {
  return {
    title: 'Préparation courte, cap sur la régularité',
    beginnerText: `Ta plus longue sortie récente fait ${km(p.longestKm)} pour une course de ${km(p.raceKm)}. Préparation courte : vise une allure régulière et finis en confiance.`,
    athleteText: `Plus longue sortie : ${km(p.longestKm)} (${pct(p.sharePct)} de la course) ; en ${plural(p.weeksLeft, 'semaine')}, +10 % par semaine n’atteint pas 60 %. Préparation courte : vise une allure régulière et finis en confiance.`,
    why: 'Les sorties longues habituent le corps à tenir la durée de la course. Rattraper l’écart progressivement demanderait plus de semaines qu’il n’en reste. Mieux vaut donc partir à un rythme régulier et garder des forces pour la fin.',
  };
}

/** 10 jours ou moins : aucune critique, uniquement allure et affûtage. */
export function racePrepFinalCopy(p: { daysToRace: number; targetPaceSec?: number }): InsightCopy {
  return {
    title: 'Dernière ligne droite : allure et affûtage',
    beginnerText: 'La course approche : allège tes sorties cette semaine. Le jour J, pars à une allure régulière.',
    athleteText:
      p.targetPaceSec === undefined
        ? `À J-${p.daysToRace}, allège tes sorties. Pars sur une allure régulière dès le départ.`
        : `À J-${p.daysToRace}, allège tes sorties. Vise ${paceFr(p.targetPaceSec)} de façon régulière dès le départ.`,
    why: 'Dans les derniers jours, on ne gagne plus de forme : on arrive reposé en réduisant le volume. Une allure régulière dès le départ aide à garder des forces pour la fin. Le calcul se base sur la date de ta course et, si tu en as un, sur ton objectif de temps.',
  };
}

export function racePrepPastCopy(p: PrepNumbers & { targetKm: number }): InsightCopy {
  return {
    title: 'Ta préparation manquait de sorties longues',
    beginnerText: `Avant ta course, ta plus longue sortie faisait ${km(p.longestKm)} pour ${km(p.raceKm)} de course. La prochaine fois, prévois une sortie d’au moins ${km(p.targetKm)} avant le jour J.`,
    athleteText: `Plus longue sortie des ${p.weeks} semaines avant la course : ${km(p.longestKm)}, soit ${pct(p.sharePct)} de la distance. Vise au moins ${km(p.targetKm)} (60 %) avant la prochaine.`,
    why: `Les sorties longues habituent le corps à tenir la durée de la course. En dessous de 60 % de la distance, la fin de course peut devenir plus difficile. Ce bilan porte sur tes courses des ${p.weeks} semaines précédant la course.`,
  };
}

// ─── gap_resume ───────────────────────────────────────────────────────────────

export const GAP_LABELS = {
  days: 'Jours depuis ta dernière activité',
  before: (weeks: number) => `Séances sur les ${weeks} semaines avant la coupure`,
  usual: 'Séance habituelle (durée médiane)',
  resume: 'Séance de reprise',
};

export function gapResumeCopy(p: {
  days: number;
  lastDate: string;
  resumeMin: number;
  /** reprise en % de la séance habituelle (coupure courte) ; undefined = durée fixe (coupure longue) */
  relative?: { ratioPct: number; usualMin: number };
}): InsightCopy {
  return {
    title: 'Reprends en douceur',
    beginnerText: p.relative
      ? `Ça fait ${p.days} jours sans activité enregistrée. Reprends par une sortie facile d’environ ${p.resumeMin} minutes.`
      : `Ça fait ${p.days} jours sans activité enregistrée. Reprends par une sortie facile de ${p.resumeMin} minutes.`,
    athleteText: `${p.days} jours depuis ta dernière activité (${dateFr(p.lastDate)}). ${
      p.relative
        ? `Reprends par ${p.resumeMin} min à allure facile (${p.relative.ratioPct} % de ta séance habituelle, ${p.relative.usualMin} min).`
        : `Reprends par ${p.resumeMin} min à allure facile.`
    }`,
    why: 'Après une coupure, le corps perd un peu de forme et a besoin de se réadapter. Une première séance courte et facile te remet en route sans te mettre en difficulté. Si la coupure vient d’une blessure ou d’une maladie, demande l’avis d’un professionnel de santé avant de reprendre.',
  };
}

// ─── volume_ramp ──────────────────────────────────────────────────────────────

export const VOLUME_LABELS = {
  week: 'Volume des 7 derniers jours',
  baseline: (weeks: number) => `Moyenne hebdo (${weeks} semaines avant)`,
  ramp: 'Variation',
};

export function volumeRampCopy(p: { weekKm: number; baselineKm: number; rampPct: number; nextWeekKm: number; weeks: number }): InsightCopy {
  return {
    title: 'Ton volume a beaucoup augmenté',
    beginnerText: `Tu as couru nettement plus cette semaine que d’habitude. Garde la semaine prochaine plus calme, autour de ${km(p.nextWeekKm, 0)}.`,
    athleteText: `${km(p.weekKm)} sur 7 jours, soit +${pct(p.rampPct)} par rapport à ta moyenne de ${km(p.baselineKm)} (${p.weeks} semaines précédentes). Reste autour de ${km(p.nextWeekKm, 0)} la semaine prochaine.`,
    why: `Une hausse rapide du volume demande au corps de s’adapter plus vite qu’il ne peut. Revenir à un volume proche de ta moyenne laisse le temps d’assimiler l’effort. Le calcul compare tes 7 derniers jours à la moyenne hebdomadaire des ${p.weeks} semaines précédentes.`,
  };
}

// ─── consistency ──────────────────────────────────────────────────────────────

export const CONSISTENCY_LABELS = {
  active: (weeks: number) => `Semaines actives (${weeks} dernières)`,
  sessions: (weeks: number) => `Séances sur ${weeks} semaines`,
};

export type ConsistencyTier = 'good' | 'building' | 'restart';

export function consistencyCopy(p: { tier: ConsistencyTier; active: number; window: number; sessions: number }): InsightCopy {
  const why = `La régularité compte plus que l’intensité d’une séance isolée : c’est elle qui fait progresser sur la durée. Une semaine est « active » dès qu’elle contient au moins une séance, tous sports confondus. Ce décompte porte sur les ${p.window} dernières semaines.`;
  if (p.tier === 'good') {
    return {
      title: 'Belle régularité ces dernières semaines',
      beginnerText: `Tu as bougé ${p.active} semaines sur ${p.window}, bravo. Garde les mêmes jours pour tes séances.`,
      athleteText: `${p.active} semaines actives sur ${p.window} (${p.sessions} séances). Garde les mêmes créneaux pour tes séances.`,
      why,
    };
  }
  if (p.tier === 'building') {
    return {
      title: 'Tu as une bonne base à consolider',
      beginnerText: `Tu as été actif ${p.active} semaines sur ${p.window}, c’est un bon début. Fixe un créneau par semaine, même court, pour installer l’habitude.`,
      athleteText: `${p.active} semaines actives sur ${p.window} (${p.sessions} séances). Bloque un créneau fixe par semaine pour viser ${p.active + 1} sur ${p.window}.`,
      why,
    };
  }
  return {
    title: 'Chaque petite séance compte',
    beginnerText: `Tu as été actif ${plural(p.active, 'semaine')} sur ${p.window}. Une marche de 20 minutes par semaine suffit pour relancer l’habitude.`,
    athleteText: `${plural(p.active, 'semaine active')} sur ${p.window} (${p.sessions} séances). Programme une séance courte par semaine pour relancer.`,
    why,
  };
}

// ─── aerobic_trend ────────────────────────────────────────────────────────────

export const AEROBIC_LABELS = {
  efficiency: (quarter: string) => `Efficacité aérobie ${quarterLabel(quarter)}`,
  variation: 'Variation',
};

export function aerobicTrendCopy(p: { variationPct: number; latest: string; base: string }): InsightCopy {
  const abs = Math.abs(p.variationPct);
  const periods = `${quarterLabel(p.latest)} vs ${quarterLabel(p.base)}`;
  const how =
    'L’efficacité aérobie compare ta vitesse à ton effort cardiaque : plus elle monte, plus tu avances vite pour le même effort. Elle est calculée trimestre par trimestre, sur tes sorties avec mesure cardiaque.';
  if (p.variationPct > 0) {
    return {
      title: 'Tu progresses à effort égal',
      beginnerText: 'À effort égal, tu cours un peu plus vite qu’avant. Garde des sorties tranquilles pour continuer sur cette lancée.',
      athleteText: `À FC égale, tu cours ${pct(abs, 1)} plus vite (${periods}). Garde une majorité de sorties faciles pour consolider.`,
      why: `${how} Une hausse est un bon signe de progression de ton endurance.`,
    };
  }
  return {
    title: 'À effort égal, tu vas moins vite',
    beginnerText: 'À effort égal, tu cours un peu moins vite que sur la période précédente. Plusieurs causes sont possibles (chaleur, fatigue, parcours).',
    athleteText: `À FC égale, tu cours ${pct(abs, 1)} moins vite (${periods}). Plusieurs causes possibles (chaleur, fatigue, parcours).`,
    why: `${how} Une baisse ne signifie pas forcément une perte de forme : les prochaines sorties diront si elle se confirme.`,
  };
}

// ─── Moment fort d'une activité ───────────────────────────────────────────────

export type HighlightKind = 'fastest_comparable' | 'longest' | 'return' | 'fastest_km' | 'negative_split' | 'steady';

export interface HighlightText {
  title: string;
  value: string;
  detail: string;
}

/** Jamais le mot « record » : les textes disent « la plus rapide depuis N mois ». */
const monthsFr = (days: number): string => (days >= 330 ? '12 mois' : `${Math.round(days / 30)} mois`);

export function highlightCopyFr(
  kind: HighlightKind,
  p: {
    beginner: boolean;
    paceSec?: number;
    distanceKm?: number;
    comparable?: number;
    windowDays?: number;
    gapDays?: number;
    km?: number;
    lateInRun?: boolean;
    gainSecPerKm?: number;
    spreadSecPerKm?: number;
  },
): HighlightText {
  const window = p.windowDays ?? 0;
  switch (kind) {
    case 'fastest_comparable':
      return {
        title: p.beginner ? 'Ta sortie la plus rapide' : 'Ta sortie la plus rapide sur cette distance',
        value: paceFr(p.paceSec ?? 0),
        detail: p.beginner
          ? `Tu n’as jamais couru aussi vite sur une distance comme celle-ci depuis ${monthsFr(window)}.`
          : `Meilleure allure parmi ${p.comparable} sorties de distance comparable (±20 %) depuis ${monthsFr(window)}.`,
      };
    case 'longest':
      return {
        title: 'Ta plus longue sortie',
        value: km(p.distanceKm ?? 0),
        detail: `Plus longue que toutes tes sorties de ces ${Math.round(window / 7)} dernières semaines.`,
      };
    case 'return':
      return {
        title: p.beginner ? 'Content de te revoir' : 'Retour après une coupure',
        value: `${p.gapDays} jours`,
        detail: `Ta sortie précédente remontait à ${p.gapDays} jours. Reprendre, c’est déjà gagné.`,
      };
    case 'fastest_km':
      return {
        title: p.lateInRun ? 'Ton kilomètre le plus rapide, en fin de sortie' : 'Ton kilomètre le plus rapide',
        value: paceFr(p.paceSec ?? 0),
        detail: p.lateInRun
          ? `Km ${p.km} : tu as accéléré en fin de sortie.`
          : `Km ${p.km} de cette sortie, à ${paceFr(p.paceSec ?? 0)}.`,
      };
    case 'negative_split':
      return {
        title: p.beginner ? 'Tu as accéléré sur la fin' : 'Seconde moitié plus rapide',
        value: `−${p.gainSecPerKm} s/km`,
        detail: p.beginner
          ? 'La deuxième moitié de ta sortie était plus rapide que la première : bien géré.'
          : `Ta 2e moitié est plus rapide de ${p.gainSecPerKm} s/km que la 1re.`,
      };
    case 'steady':
      return {
        title: p.beginner ? 'Une allure très régulière' : 'Allure très stable',
        value: `±${p.spreadSecPerKm} s/km`,
        detail: 'Tes kilomètres sont presque tous au même rythme : un effort bien réparti.',
      };
  }
}
