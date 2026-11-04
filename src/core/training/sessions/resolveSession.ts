import type { Session } from './types';

/**
 * Résout un identifiant vers la séance qui le contient (ADR-012).
 *
 * Accepte :
 * - un id de séance (s_xxx) → retourne directement la séance correspondante ;
 * - un id d'activité → retourne la séance qui contient cette activité.
 *
 * Retourne `undefined` si l'identifiant est inconnu.
 */
export function resolveSession(
  sessions: readonly Session[],
  id: string,
): Session | undefined {
  // Recherche directe par id de séance
  const direct = sessions.find((s) => s.id === id);
  if (direct) return direct;

  // Recherche par id d'activité
  return sessions.find((s) => s.activityIds.includes(id));
}
