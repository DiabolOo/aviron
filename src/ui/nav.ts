import { router } from 'expo-router';

/**
 * Utilitaire de navigation vers les écrans de détail : un tap = une page.
 * Tout appel dans la fenêtre anti-rebond est ignoré ; la fenêtre (1 s) couvre
 * la transition (~350 ms) sans dépendre du moteur de navigation.
 * Seul l'id passe en paramètre ; le retour visuel immédiat reste le
 * `active:opacity-70` des lignes et liens qui appellent ces fonctions.
 */

const NAV_LOCK_MS = 1000;

let lastNavAt: number | null = null;

function pushOnce(path: string): void {
  const now = Date.now();
  if (lastNavAt !== null && now - lastNavAt < NAV_LOCK_MS) return;
  lastNavAt = now;
  router.push(path);
}

/** Onglet dont la pile reçoit l'écran empilé (ADR-012, amendement v3.4). */
export type StackTab = 'semaine' | 'progres';

/** Détail d'une séance, empilé dans l'onglet donné (Semaine par défaut, y compris depuis Aujourd'hui). */
export function openActivity(id: string, tab: StackTab = 'semaine'): void {
  pushOnce(`/(tabs)/(${tab})/activity/${id}`);
}

/** Semaine passée commençant le lundi `start` (AAAA-MM-JJ), empilée dans Semaine. */
export function openWeek(start: string): void {
  pushOnce(`/(tabs)/(semaine)/week/${start}`);
}

/** Débrief d'une course, empilé dans Progrès (ouvert depuis Tes semis). */
export function openDebrief(sessionId: string): void {
  pushOnce(`/(tabs)/(progres)/activity/${sessionId}/debrief`);
}

/** `[perf]` dev : instant du dernier tap, pour mesurer tap → premier rendu. */
export function navElapsedMs(): number | undefined {
  return lastNavAt !== null ? Date.now() - lastNavAt : undefined;
}

const PERF_LOG = __DEV__ || process.env.EXPO_PUBLIC_PERF === '1';

/**
 * Mesure tap → événement, en dev et en build minifiée avec `EXPO_PUBLIC_PERF=1`
 * (`npx expo start --no-dev --minify`). Silencieux sinon.
 */
export function perfLog(tag: string): void {
  if (!PERF_LOG) return;
  const ms = navElapsedMs();
  if (ms !== undefined) console.log(`[perf] ${tag} +${ms} ms`);
}

/** Tests : réarme la fenêtre anti-rebond. */
export function resetNavLock(): void {
  lastNavAt = null;
}
