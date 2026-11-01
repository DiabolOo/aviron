import type { Palette } from '@/constants/theme';

export interface SportTokens {
  /** teinte soutenue : icône du journal, courbe */
  color: string;
  /** pastel : dégradé du haut de l'écran, fondu vers le neutre */
  tint: string;
}

/**
 * Couleur par sport (course indigo-violet, nage bleu ciel, vélo vert d'eau, marche sable, musculation prune),
 * à luminosité constante en clair et en sombre. Jamais d'orange ni de jaune : réservés à la flamme.
 */
export function sportTokens(colors: Palette, type: string): SportTokens {
  switch (type) {
    case 'run':
      return { color: colors.sportRun, tint: colors.sportRunTint };
    case 'swim':
      return { color: colors.sportSwim, tint: colors.sportSwimTint };
    case 'ride':
      return { color: colors.sportRide, tint: colors.sportRideTint };
    case 'walk':
      return { color: colors.sportWalk, tint: colors.sportWalkTint };
    default:
      return { color: colors.sportStrength, tint: colors.sportStrengthTint };
  }
}
