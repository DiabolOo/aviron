import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 72;
const GAP = 16;

/** Hauteur de la barre d'onglets flottante + zone sûre + marge : espace à réserver en bas du contenu. */
export function useTabBarInset(): number {
  const { bottom } = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(bottom, 12) + 8 + GAP;
}
