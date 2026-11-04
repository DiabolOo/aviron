import { useEffect, useRef, useState } from 'react';

import { motion } from '@/src/design';

/**
 * Le squelette n'apparaît qu'après `motion.skeleton.delay` d'attente (un chargement rapide ne
 * clignote pas) et, une fois affiché, reste au moins `motion.skeleton.minVisible`.
 */
export function useDelayedSkeleton(isLoading: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (shownAt.current !== null) return;
      const t = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, motion.skeleton.delay);
      return () => clearTimeout(t);
    }
    if (shownAt.current === null) return;
    const left = motion.skeleton.minVisible - (Date.now() - shownAt.current);
    const t = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, Math.max(0, left));
    return () => clearTimeout(t);
  }, [isLoading]);

  return visible;
}
