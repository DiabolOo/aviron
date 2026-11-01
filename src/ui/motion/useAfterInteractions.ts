import { useEffect, useState } from 'react';

import { perfLog } from '@/src/ui/nav';

/**
 * `true` une fois la transition de navigation terminée : le contenu coûteux
 * (carte SVG, courbes, animations de tracé) se monte sans gêner l'animation
 * d'entrée. `requestIdleCallback` est le successeur d'`InteractionManager`
 * (retiré du core RN) ; le `timeout` borne l'attente à ~la durée d'une transition.
 * `perfTag` journalise `[perf] <tag> ready +N ms` en dev (mesure tap → écran
 * complet ; le premier rendu est journalisé par l'écran).
 */
export function useAfterInteractions(perfTag?: string): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = () => {
      if (perfTag) perfLog(`${perfTag} ready`);
      setReady(true);
    };
    if (typeof requestIdleCallback === 'function') {
      const handle = requestIdleCallback(task, { timeout: 400 });
      return () => cancelIdleCallback(handle);
    }
    const handle = setTimeout(task, 0); // Jest / ancien RN
    return () => clearTimeout(handle);
  }, [perfTag]);

  return ready;
}
