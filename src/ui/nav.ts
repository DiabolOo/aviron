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

export function openActivity(id: string): void {
  pushOnce(`/activity/${id}`);
}

export function openRace(id: string): void {
  pushOnce(`/race/${id}`);
}

export function openActivities(): void {
  pushOnce('/activities');
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
