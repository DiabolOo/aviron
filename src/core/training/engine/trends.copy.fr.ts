import { formatDayMonth } from '../../dates';
import { EFFICIENCY_MIN_RUNS_PER_MONTH, EFFICIENCY_MIN_RUN_KM, EFFICIENCY_MONTHS, VOLUME_WEEKS } from './trends';
import type { EfficiencyTrend, IntensityTrend, VolumeTrend } from './trends';
import { INTENSITY_MIN_RUN_KM, INTENSITY_WINDOW_WEEKS } from '../insights/thresholds';

// Messages d'états vides : ils disent où en est l'utilisateur, pas la règle.

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
const lastHrSentence = (lastHrDate?: string) =>
  lastHrDate ? ` Dernière course avec FC : ${formatDayMonth(lastHrDate)}.` : '';

export function volumeEmptyText(volume: VolumeTrend): string {
  const active = volume.weeks.filter((w) => w.sessions > 0).length;
  if (active === 0) return `Aucune activité sur les ${VOLUME_WEEKS} dernières semaines.`;
  return `${active} semaine active sur ${VOLUME_WEEKS} : il te manque une semaine avec activité pour voir une tendance.`;
}

export function intensityEmptyText(intensity: IntensityTrend, lastHrDate?: string): string {
  if (intensity.status === 'noMaxHr') {
    return 'FC max inconnue : renseigne ton âge ou ta FC max dans le profil pour calculer tes zones.';
  }
  const win = `${INTENSITY_WINDOW_WEEKS} dernières semaines`;
  if (intensity.candidates === 0) return `Aucune sortie de plus de ${INTENSITY_MIN_RUN_KM} km sur les ${win}.`;
  if (intensity.runs === 0) {
    const n = intensity.candidates;
    return `${n > 1 ? `Aucune de tes ${n} sorties` : 'Ta sortie'} de plus de ${INTENSITY_MIN_RUN_KM} km sur les ${win} n’a de FC.${lastHrSentence(lastHrDate)}`;
  }
  const missing = intensity.required - intensity.runs;
  return `Il te manque ${plural(missing, 'sortie', 'sorties')} de plus de ${INTENSITY_MIN_RUN_KM} km avec FC sur les ${win} (${intensity.runs} sur ${intensity.required}).`;
}

export function efficiencyEmptyText(efficiency: EfficiencyTrend, lastHrDate?: string): string {
  const need = `${EFFICIENCY_MIN_RUNS_PER_MONTH} sorties de plus de ${EFFICIENCY_MIN_RUN_KM} km avec FC`;
  const win = `${EFFICIENCY_MONTHS} derniers mois`;
  if (efficiency.reliableMonths === 0) {
    return `Aucun mois avec ${need} sur les ${win}.${lastHrSentence(lastHrDate)}`;
  }
  const missing = efficiency.requiredMonths - efficiency.reliableMonths;
  return `Il te manque ${plural(missing, 'mois', 'mois')} avec ${need} (${efficiency.reliableMonths} mois sur ${efficiency.requiredMonths} requis, sur les ${win}).`;
}

/** Ligne unique qui remplace Intensités et Efficacité quand aucune course récente n'a de FC. */
export function hrAbsentText(lastHrDate: string | undefined, asOf: string): string {
  if (!lastHrDate) return 'FC absente : aucune course avec FC enregistrée';
  const year = lastHrDate.slice(0, 4) !== asOf.slice(0, 4) ? ` ${lastHrDate.slice(0, 4)}` : '';
  return `FC absente depuis le ${formatDayMonth(lastHrDate)}${year}`;
}
