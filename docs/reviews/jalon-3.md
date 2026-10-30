# Revue Jalon 3 — Socle modulaire & contrats de données

## Tâches faites / non faites
- Faites : ADR-001, réorganisation `src/`, schémas Zod, repositories mock + local, **T5** store branché sur les repositories (+ migration de la sauvegarde `pulsefit-mvp3`), **T6** `getDailyBalance`, **T7** invariant macros, **T8** `LifeModule` + registre, **T9** feature flags, **T10** `ProposalCard` + store des propositions + toast Annuler.
- Non faites : aucune. Le jalon reste ⏳ tant que la DoD n'est pas validée sur téléphone.

## DoD
- « L'app tourne à l'identique » : typecheck, lint, 68 tests et `npx expo export --platform web` OK. **À valider sur device** (voir étapes ci-dessous).
- « Module test sans toucher la navigation » : `src/modules/test/` existe, désactivé par défaut. L'activer = `MODULE_FLAG_OVERRIDES = { test: true }` dans `src/modules/flags.ts` ; aucune route ni `_layout` modifié. Couvert par `src/modules/flags.test.ts` et `registry.test.ts`.

## Décisions prises
- Le store garde les types UI (`src/core/types.ts`) ; les repositories parlent les types Zod, conversion dans `src/data/mappers.ts`.
- Adaptateur par défaut `local` (AsyncStorage, seedé au premier lancement depuis l'ancienne sauvegarde ou les mocks). `EXPO_PUBLIC_DATA_ADAPTER=mock` pour des données en mémoire.
- Sauvegarde brute de l'ancien état dans la clé `pf:legacy-mvp3` (filet de sécurité, jamais relue automatiquement).
- Objectif calorique : `macrosTarget` est la seule source ; `calorieTarget` est synchronisé automatiquement.
- Feature flags sans UI (fichier de config), pour limiter les boutons.
- Lint : `no-restricted-imports` interdit les mocks / adaptateurs dans `app/`, `components/`, `lib/`.

## Questions ouvertes
- Aucune bloquante.

## Risques et dette technique
- `adjust_nutrition_targets` modifie l'objectif de base (pas encore de cibles par jour, prévu J10).
- Les propositions mockées sont générées une seule fois (au premier lancement) ; l'aperçu « Sam. → Dim. » est figé.
- Import circulaire `lib/store.ts` ↔ `lib/proposalStore.ts` (usages paresseux uniquement, sans effet à l'exécution).
- Les types UI et les schémas Zod restent doublés : à converger au J4/J5.

## Comment tester sur le téléphone
1. `npx expo start --clear` puis ouvrir dans Expo Go (SDK 58).
2. Vérifier que tes repas, séances et profil existants sont toujours là (migration).
3. Aujourd'hui : sous l'anneau, une carte de proposition. « Pourquoi ? » déplie l'explication ; « Valider » affiche le toast « … · Annuler » pendant 5 s.
4. Valider « +40 g de glucides » puis ouvrir Nutrition : le total en en-tête et le restant sur Aujourd'hui doivent concorder (restant = budget − mangé).
5. Tester « Modifier » et la croix (refuser) sur les propositions suivantes.

## Fichiers principaux modifiés
`lib/store.ts`, `lib/proposalStore.ts`, `src/core/{balance,proposals,proposalActions,schemas,nutritionCalculator}.ts`, `src/data/{seed,mappers,instance,index}.ts` + adaptateurs, `src/agent/*`, `src/modules/*`, `src/ui/proposals/*`, `app/_layout.tsx`, `app/(tabs)/{index,_layout,nutrition}.tsx`, `eslint.config.js`.
