import { size, space } from '@/src/design';

/** Hauteur de la barre d'onglets (zone de l'indicateur d'accueil comprise) + marge : espace à réserver en bas du contenu. */
export const TAB_BAR_HEIGHT = size.tabBar;

export function useTabBarInset(): number {
  return TAB_BAR_HEIGHT + space.lg;
}
