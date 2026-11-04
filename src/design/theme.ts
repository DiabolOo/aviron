import { Easing } from 'react-native-reanimated';

/**
 * PulseFit — tokens de la direction v3.1 (« Phrase d'abord, chiffre ensuite »).
 *
 * Règle : aucune valeur de style en dehors de ce fichier. Une taille, une couleur,
 * un rayon ou un espacement qui n'existe pas ici n'existe pas dans l'app.
 *
 * Polices attendues (expo-google-fonts) :
 *   @expo-google-fonts/inter       → Inter_400Regular, Inter_600SemiBold
 *   @expo-google-fonts/inter-tight → InterTight_600SemiBold, InterTight_700Bold
 * Sur Android, fontWeight ne choisit pas le fichier de police : on passe toujours
 * par fontFamily, d'où la table `fontFamily` indexée par graisse.
 */

// ─── Couleurs ────────────────────────────────────────────────────────────────

export type ColorScheme = 'light' | 'dark';

export type Palette = {
  /** Fond de l'écran. */
  bg: string;
  /** Cartes, barre d'onglets, champs. */
  surface: string;
  /** Blocs internes (avant/après, piste de la barre de maintien, ligne du jour). */
  surfaceSunken: string;
  /** Texte principal, chiffres, bouton plein. */
  ink: string;
  /** Texte secondaire (corps, sous-texte). 4,5:1 minimum sur bg et surface. */
  inkSecondary: string;
  /** Légendes, onglets inactifs, sources. 4,5:1 minimum sur bg et surface. */
  inkTertiary: string;
  /** Liserés de carte, séparateurs, contour des boutons secondaires. */
  line: string;
  /** Barres de graphique neutres (non mises en avant). */
  barNeutral: string;

  /** La voix du coach : libellé « Ton coach », mise en avant, bouton de dictée. */
  coach: string;
  /** Fond du bloc « Après » d'une proposition. */
  coachSurface: string;
  /** Texte ou icône posé sur `coach`. */
  onCoach: string;

  /** Bouton plein (un seul par écran). */
  buttonPrimary: string;
  onButtonPrimary: string;

  /** Effort : facile. Texte, fond de pastille, point. */
  effortEasy: string;
  effortEasySurface: string;
  effortEasyDot: string;
  /** Effort : soutenu. */
  effortModerate: string;
  effortModerateSurface: string;
  effortModerateDot: string;
  /** Effort : intense. */
  effortHard: string;
  effortHardSurface: string;
  effortHardDot: string;

  /** Action destructive (supprimer le compte). */
  danger: string;

  /** Halo Aurore en haut d'Aujourd'hui : dégradé linéaire de `haloTop` vers transparent. */
  haloTop: string;
  haloBottom: string;
};

export const colors: Record<ColorScheme, Palette> = {
  light: {
    bg: '#F4F5F7',
    surface: '#FFFFFF',
    surfaceSunken: '#EEF0F3',
    ink: '#0B0D12',
    inkSecondary: '#4A5160',
    inkTertiary: '#5F6776',
    line: '#E1E4EA',
    barNeutral: '#C9CDD6',

    coach: '#4F46E5',
    coachSurface: '#EEEDFD',
    onCoach: '#FFFFFF',

    buttonPrimary: '#0B0D12',
    onButtonPrimary: '#FFFFFF',

    effortEasy: '#0B6B35',
    effortEasySurface: '#E1F5E8',
    effortEasyDot: '#16A34A',
    effortModerate: '#8A5300',
    effortModerateSurface: '#FDF0D5',
    effortModerateDot: '#E89B0C',
    effortHard: '#B4321C',
    effortHardSurface: '#FDE4DF',
    effortHardDot: '#E2553B',

    danger: '#B42318',

    haloTop: '#FFE6D5',
    haloBottom: 'rgba(244, 245, 247, 0)',
  },
  dark: {
    bg: '#0A0C10',
    surface: '#151922',
    surfaceSunken: '#1E2430',
    ink: '#F3F5F8',
    inkSecondary: '#B0B7C3',
    inkTertiary: '#8E97A7',
    line: '#2A303C',
    barNeutral: '#3A4150',

    coach: '#8B83FF',
    coachSurface: '#221F45',
    // Le blanc sur #8B83FF ne passe pas 4,5:1 : en sombre, on pose l'encre.
    onCoach: '#0B0D12',

    buttonPrimary: '#F3F5F8',
    onButtonPrimary: '#0B0D12',

    effortEasy: '#6EDB9A',
    effortEasySurface: '#132B1D',
    effortEasyDot: '#4ADE80',
    effortModerate: '#F6C25C',
    effortModerateSurface: '#31260F',
    effortModerateDot: '#F5B032',
    effortHard: '#FF907A',
    effortHardSurface: '#3A1A14',
    effortHardDot: '#FF7A5F',

    danger: '#FF8A80',

    haloTop: '#2A1A14',
    haloBottom: 'rgba(10, 12, 16, 0)',
  },
};

// ─── Typographie ─────────────────────────────────────────────────────────────

/** Les 3 graisses autorisées. */
export const fontWeight = {
  regular: '400',
  semibold: '600',
  bold: '700',
} as const;
export type FontWeight = keyof typeof fontWeight;

/** Famille de police par graisse. Inter Tight n'existe ici qu'en 600 et 700. */
export const fontFamily = {
  text: {
    regular: 'Inter_400Regular',
    semibold: 'Inter_600SemiBold',
  },
  display: {
    semibold: 'InterTight_600SemiBold',
    bold: 'InterTight_700Bold',
  },
} as const;

/**
 * Les 6 tailles. Chaque rôle fixe sa taille, son interligne, sa famille, les graisses
 * permises et son plafond d'agrandissement (maxFontSizeMultiplier ; null = aucun plafond).
 */
export const typography = {
  /** Un seul par écran. Chiffres tabulaires. */
  hero: {
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -1.92,
    family: 'display',
    weights: ['semibold'],
    maxFontSizeMultiplier: 1.25,
    tabularNums: true,
  },
  /** Titre de page, nom de séance. */
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    family: 'display',
    weights: ['bold'],
    maxFontSizeMultiplier: 1.5,
    tabularNums: false,
  },
  /** Phrase du coach (bold) et chiffres secondaires (semibold, tabulaires). */
  verdict: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    family: 'display',
    weights: ['semibold', 'bold'],
    maxFontSizeMultiplier: null,
    tabularNums: true,
  },
  /** Texte courant, libellés de bouton. */
  body: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
    family: 'text',
    weights: ['regular', 'semibold'],
    maxFontSizeMultiplier: null,
    tabularNums: true,
  },
  /** Lignes de liste, détails. */
  sub: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    family: 'text',
    weights: ['regular', 'semibold'],
    maxFontSizeMultiplier: null,
    tabularNums: true,
  },
  /** Plancher absolu : légendes, sources, onglets. */
  caption: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    family: 'text',
    weights: ['regular', 'semibold'],
    maxFontSizeMultiplier: null,
    tabularNums: true,
  },
} as const;
export type TextRole = keyof typeof typography;

/** Exceptions de plafond liées à un usage, pas à une taille. */
export const fontScaleCaps = {
  /** Chiffres secondaires (rôle verdict en semibold) dans un trio. */
  metric: 1.5,
  /** Libellés de la barre d'onglets : la hauteur de barre est fixe. */
  tabLabel: 1.2,
  /** Pastille d'effort : elle grandit avec le texte, jusqu'à ×1,5. */
  pill: 1.5,
} as const;

/** Seuils de mise en page selon useWindowDimensions().fontScale. */
export const fontScaleBreakpoints = {
  /** Unité du héros sous le nombre, trio en colonne, avant/après empilés, boutons empilés. */
  stack: 1.3,
} as const;

/** Réduction maximale du héros quand il déborde (adjustsFontSizeToFit). */
export const heroMinimumFontScale = 0.7;

// ─── Rayons ──────────────────────────────────────────────────────────────────

export const radius = {
  /** Boutons, champs, blocs internes. */
  control: 16,
  /** Cartes. */
  card: 24,
  /** Pastilles, puces, avatar. */
  pill: 999,
} as const;

// ─── Espacement ──────────────────────────────────────────────────────────────

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  /** Marges latérales d'écran, padding de carte. */
  screen: 20,
  xl: 24,
  /** Entre deux sections. */
  section: 32,
} as const;

// ─── Dimensions ──────────────────────────────────────────────────────────────

export const size = {
  /** Cible tactile minimale. */
  touchMin: 48,
  /** Hauteur du bouton plein et du bouton contour. */
  button: 52,
  /** Hauteur du lien souligné (bouton tertiaire) et des puces. */
  buttonCompact: 44,
  /** Pastille d'effort (hauteur minimale, grandit avec le texte). */
  pill: 28,
  pillDot: 8,
  avatar: 44,
  /** Icônes (lucide) : taille et épaisseur de trait. */
  icon: 24,
  iconStroke: 1.8,
  iconStrokeStrong: 2.2,
  /** Barre d'onglets, zone de l'indicateur d'accueil comprise. */
  tabBar: 84,
  /** Piste de la barre de maintien et des barres de progression. */
  track: 6,
  /** Liseré de carte et séparateurs. */
  hairline: 1,
  /** Contour du bouton secondaire. */
  outline: 1.5,
  /** Distance minimale entre une action et le bord de l'écran. */
  edgeClearance: 16,
} as const;

/** Retour visuel d'appui. */
export const opacity = { pressed: 0.7 } as const;

// ─── Mouvement ───────────────────────────────────────────────────────────────

/** Durées en ms. Voir SPEC-v3.md, « Mouvement ». */
export const motion = {
  /** Pression, contrôle. */
  fast: 150,
  /** Apparition, bandeau. */
  base: 250,
  /** Compteur, carte qui se replie. */
  slow: 400,
  /** Validation par maintien : un geste, pas une animation. */
  hold: 600,
  /** Durée d'affichage du bandeau « Annuler ». */
  undo: 5000,
  /** Squelette : n'apparaît qu'après `delay` d'attente, reste au moins `minVisible`. */
  skeleton: { delay: 300, minVisible: 300 },
  /** Courbe unique (fonction worklet, utilisable aussi côté JS). */
  easing: Easing.out(Easing.cubic),
  /** Uniquement pour la coche de validation. */
  spring: { damping: 18, stiffness: 220 },
} as const;

// ─── Thème assemblé ──────────────────────────────────────────────────────────

export type Theme = {
  scheme: ColorScheme;
  colors: Palette;
  typography: typeof typography;
  fontWeight: typeof fontWeight;
  fontFamily: typeof fontFamily;
  fontScaleCaps: typeof fontScaleCaps;
  fontScaleBreakpoints: typeof fontScaleBreakpoints;
  heroMinimumFontScale: typeof heroMinimumFontScale;
  radius: typeof radius;
  space: typeof space;
  size: typeof size;
  opacity: typeof opacity;
  motion: typeof motion;
};

export const makeTheme = (scheme: ColorScheme): Theme => ({
  scheme,
  colors: colors[scheme],
  typography,
  fontWeight,
  fontFamily,
  fontScaleCaps,
  fontScaleBreakpoints,
  heroMinimumFontScale,
  radius,
  space,
  size,
  opacity,
  motion,
});

/**
 * Style de texte prêt pour <Text>. Refuse (au typage) une graisse non permise pour le rôle.
 * Le plafond d'agrandissement se passe à part : <Text maxFontSizeMultiplier={...}>.
 */
export function textStyle<R extends TextRole>(
  role: R,
  weight: (typeof typography)[R]['weights'][number],
) {
  const t = typography[role];
  const family = fontFamily[t.family] as Record<string, string>;
  return {
    fontFamily: family[weight],
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    ...(t.tabularNums ? { fontVariant: ['tabular-nums' as const] } : {}),
  };
}
