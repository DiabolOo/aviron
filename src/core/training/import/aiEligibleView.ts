import type { Activity } from '../../schemas';
import type { Session } from '../sessions/types';

export type AiEligibleView = {
  activities: Activity[];
  sessions: Session[];
};

/**
 * Vue filtrée pour le résumé IA.
 *
 * Règles (ADR-013) :
 * - Toute activité dont `aiEligible` est faux est exclue.
 * - Une séance est exclue si AU MOINS UNE de ses activités est non éligible (séance mixte).
 * - Les agrégats (volume, régularité, tendances) doivent être recalculés sur cette vue,
 *   jamais sur l'ensemble des activités.
 *
 * Fonction pure, sans mutation, sans effets de bord.
 */
export function aiEligibleView(
  activities: readonly Activity[],
  sessions: readonly Session[],
): AiEligibleView {
  const eligibleIds = new Set(activities.filter((a) => a.aiEligible).map((a) => a.id));

  const eligibleActivities = activities.filter((a) => a.aiEligible);

  // Une séance est éligible seulement si toutes ses activités le sont
  const eligibleSessions = sessions.filter((s) => s.activityIds.every((id) => eligibleIds.has(id)));

  return { activities: eligibleActivities, sessions: eligibleSessions };
}
