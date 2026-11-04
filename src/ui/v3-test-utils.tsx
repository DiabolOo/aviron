import type { ReactNode } from 'react';

import { DesignPreviewProvider, type DesignPreview } from '@/src/design';

/** Rend avec des réglages d'affichage forcés (schéma, texte agrandi, réduire les animations). */
export function withPreview(preview: DesignPreview, node: ReactNode) {
  return <DesignPreviewProvider value={preview}>{node}</DesignPreviewProvider>;
}
