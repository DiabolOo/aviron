# ADR-011 — Styles dérivés des tokens v3.1, NativeWind gelé

- **Date** : 2026-11-04
- **Statut** : Accepté
- **Décideur** : Julien (propriétaire produit)

---

## Contexte

La direction v3.1 (`docs/SPEC-v3.md`) pose une règle : aucune valeur de style hors de
`src/design/theme.ts`. Deux systèmes cohabitaient : NativeWind (classes Tailwind, 95 fichiers)
et des couleurs JS (`constants/theme.ts`, `src/ui/useTheme.ts`). Il fallait n'en garder qu'un.

Ce que la v3.1 exige et que Tailwind exprime mal :

- un **rôle de texte** est un tout (famille par graisse, taille, interligne, approche, chiffres
  tabulaires) dont les graisses permises sont vérifiées au typage (`textStyle`) ;
- `maxFontSizeMultiplier`, `adjustsFontSizeToFit`, `minimumFontScale` sont des **props**, pas des styles ;
- l'empilement au-delà de `fontScaleBreakpoints.stack` se décide **en JS** (`useWindowDimensions().fontScale`) ;
- sur Android, la graisse passe par `fontFamily` (le contournement actuel lit `className` par regex dans `Text.tsx`).

## Options

1. **Tailwind généré depuis `theme.ts`**, seules ces classes permises. Il faudrait remplacer
   (et non étendre) toutes les échelles par défaut, interdire les valeurs arbitraires `[…]` par une
   règle qui analyse les chaînes de classes, et garder du JS pour tout ce qui précède : deux systèmes
   resteraient de toute façon. Aucune vérification de typage sur les noms de classes.
2. **`StyleSheet` dérivés des tokens**, NativeWind abandonné. Une seule source, typée : un token
   inexistant est une erreur de compilation. La règle ESLint porte sur l'AST des objets de style.

## Décision

Option 2.

- `src/design/` : `theme.ts` (tokens), `useTheme()` (clair / sombre selon le système),
  `makeStyles((t) => …)` (feuille `StyleSheet` créée une fois par schéma), `designFonts`.
- `pulsefit/no-literal-style` refuse hors de `src/design/` toute couleur littérale (hex, rgb, hsl)
  et tout nombre littéral non nul pour `fontSize`, `lineHeight`, `letterSpacing`, `*Radius`,
  `padding*`, `margin*`, `gap`.
- `pulsefit/no-classname` refuse `className` / `*ClassName` partout.
- Les fichiers existants sont listés dans `eslint-rules/legacy-exceptions.js`, par étape de
  migration. On retire une ligne par fichier migré, on n'en ajoute jamais ; un test échoue si une
  exception ne sert plus.

## Conséquences

- **Plus verbeux** que des classes pour la mise en page (`flexDirection: 'row'` au lieu de `flex-row`).
  Les dimensions de mise en page (`width`, `flex`, `opacity`…) restent libres : seules les valeurs
  de design sont verrouillées.
- **Cohabitation transitoire** : NativeWind, `tailwind.config.js` (gelé), `global.css`,
  `constants/theme.ts`, `src/ui/useTheme.ts` et les polices Inter 500 / 700 / SpaceMono restent
  tant que la liste d'exceptions n'est pas vide. Deux palettes coexistent pendant la migration :
  un écran migré change d'apparence d'un coup, ce qui est voulu.
- **À la fin de la migration** : retirer `nativewind`, `tailwindcss`, `prettier-plugin-tailwindcss`,
  le preset Babel `jsxImportSource: 'nativewind'`, `withNativeWind` (Metro), `global.css`,
  `nativewind-env.d.ts`. Moins de transformation au build, une dépendance native de moins à suivre
  à chaque montée d'Expo.
- **Préférence de thème** : `colorScheme.set()` de NativeWind répercute la préférence de l'app sur
  `Appearance` ; le `useColorScheme()` de React Native, lu par `useTheme()`, la suit donc déjà.
  Au retrait de NativeWind, appeler `Appearance.setColorScheme()` directement.
