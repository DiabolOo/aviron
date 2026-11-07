import type { Activity } from '../schemas';
import { NO_HR_MIN_MISSING, NO_HR_WINDOW_RUNS } from './insights/thresholds';

const MONTHS_FR = [
  'janvier', 'f\u00e9vrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'ao\u00fbt', 'septembre', 'octobre', 'novembre', 'd\u00e9cembre',
];

function monthFr(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7)) - 1;
  return MONTHS_FR[month] ?? isoDate.slice(0, 7);
}

function hasHr(a: Activity): boolean {
  return a.avgHr !== undefined && a.avgHr > 0;
}

/**
 * Ligne de repère pour la SessionCard.
 * - Renvoie un texte si les dernières `NO_HR_WINDOW_RUNS` courses ont ≥ `NO_HR_MIN_MISSING`
 *   sans FC (c'est-à-dire que la FC n'a pas été reçue récemment).
 * - `today` : YYYY-MM-DD — aucun appel à `new Date()` pour garder la fonction pure et testable.
 * - Renvoie `undefined` si les données FC sont à jour ou si l'historique est trop court.
 */
export function sessionRepere(activities: readonly Activity[], today: string): string | undefined {
  const runs = activities
    .filter((a) => a.type === 'run' && a.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  if (runs.length < NO_HR_WINDOW_RUNS) return undefined;

  const recent = runs.slice(-NO_HR_WINDOW_RUNS);
  const missingCount = recent.filter((a) => !hasHr(a)).length;
  if (missingCount < NO_HR_MIN_MISSING) return undefined;

  // Trouver la dernière course qui avait une FC pour le "depuis {mois}"
  const lastWithHr = [...runs].reverse().find(hasHr);

  if (!lastWithHr) {
    // Jamais eu de FC : guide uniquement à l'allure et à la sensation, sans date
    return 'Je te guide \u00e0 l\u2019allure et \u00e0 la sensation.';
  }

  const month = monthFr(lastWithHr.date);
  return `Pas de cardio sur tes sorties depuis ${month}\u00a0: je te guide \u00e0 l\u2019allure et \u00e0 la sensation.`;
}
