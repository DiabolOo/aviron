import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useWindowDimensions } from 'react-native';

import type { ColorScheme } from './theme';

/**
 * Réglages d'affichage forcés localement (galerie de dev) : schéma de couleurs, agrandissement
 * du texte, réduction des animations. Hors d'un fournisseur, les réglages système s'appliquent.
 */
export type DesignPreview = {
  scheme?: ColorScheme;
  fontScale?: number;
  reduceMotion?: boolean;
};

const PreviewContext = createContext<DesignPreview>({});

export function DesignPreviewProvider({ value, children }: { value: DesignPreview; children: ReactNode }) {
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function useDesignPreview(): DesignPreview {
  return useContext(PreviewContext);
}

/** Agrandissement du texte en vigueur : forcé par la galerie, sinon celui du système. */
export function useFontScale(): number {
  const { fontScale } = useWindowDimensions();
  return useDesignPreview().fontScale ?? fontScale;
}

/** « Réduire les animations » : forcé par la galerie, sinon le réglage système. */
export function useReduceMotion(): boolean {
  const forced = useDesignPreview().reduceMotion;
  const [system, setSystem] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setSystem(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystem);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return forced ?? system;
}
