# ADR-001 — Architecture modulaire `core / modules / agent / data / ui`

- **Date** : 2026-10-30
- **Statut** : Accepté
- **Décideur** : Julien (propriétaire produit)

---

## Contexte

Au jalon 2, toute la logique métier (calculs nutritionnels, types, store Zustand, mocks, utilitaires)
est concentrée dans un seul dossier `lib/`. Les composants React importent directement les mocks.
Cette organisation rend impossible :
- de tester la logique métier sans React (pas de framework de test en place) ;
- de brancher un vrai backend sans toucher les composants UI ;
- d'ajouter un nouveau « domaine de vie » (sommeil, agenda…) sans modifier la navigation.

## Décision

Adopter l'architecture en cinq couches suivante :

```
src/
  core/        # Logique déterministe pure — TypeScript, sans React ni réseau
               # Calculs nutritionnels, charge d'entraînement, validation de plans, dates
               # 100 % testée (jest-expo)

  modules/     # Un dossier par domaine de vie, chacun exposant un manifeste LifeModule
               # sport/  nutrition/  profile/  sleep/  calendar/ …
               # Ajouter un module = créer un dossier, sans toucher la navigation

  agent/       # Client de la passerelle LLM, routeur de modèles, prompts versionnés,
               # outils exposés aux agents, harnais d'évals

  data/        # Interfaces de repositories (contrats) + adaptateurs :
               #   mock    → données en mémoire pour le développement
               #   local   → AsyncStorage (alpha local-first)
               #   supabase → Supabase UE (béta publique, jalon 5)
               # L'UI n'importe JAMAIS les mocks directement

  ui/          # Design system : tokens, Card, ProposalCard, CommandBar, useTheme…

app/           # Routes Expo Router (fines : elles assemblent les modules, sans logique)
evals/         # Jeux de cas JSON + scoring des sorties IA (CI)
docs/adr/      # Décisions d'architecture (ce dossier)
```

### Manifeste `LifeModule`

Chaque module expose un objet unique qui déclare ses entités, widgets, dashboards et outils agent :

```ts
export interface LifeModule {
  id: string                  // identifiant stable : 'sport' | 'nutrition' | 'profile' | …
  entities: ZodTypeAny[]      // schémas Zod des entités du module
  todayWidgets: TodayWidget[] // cartes affichées dans l'onglet « Aujourd'hui »
  dashboards: Dashboard[]     // écrans disponibles dans « Suivi »
  agentTools: AgentTool[]     // outils que l'agent peut appeler (lecture libre, écriture via Proposal)
  analyzers: Analyzer[]       // jobs quotidiens / hebdo produisant des Insights
}
```

Ajouter un module = créer `src/modules/<nom>/index.ts` + l'enregistrer dans `src/modules/registry.ts`.
**Aucune modification de la navigation, des routes ou du store global n'est nécessaire.**

## Alternatives rejetées

| Alternative | Raison du rejet |
|---|---|
| Conserver `lib/` tel quel et ajouter des couches par-dessus | La dette s'accumule ; les imports croisés rendent les tests impossibles |
| Monorepo Turborepo avec packages séparés | Sur-ingénierie pour un seul développeur ; friction trop élevée en phase alpha |
| Feature-first (dossier par fonctionnalité plutôt que par couche) | Difficile de partager la logique `core` entre fonctionnalités |
| Nx ou autre outil de workspace | Idem monorepo : complexité non justifiée à ce stade |

## Conséquences

**Positives**
- La logique `src/core/` est testable sans Expo, React Native ni réseau.
- Brancher Supabase (jalon 5) = créer un adaptateur dans `src/data/adapters/supabase/`, sans toucher l'UI.
- Chaque nouveau domaine de vie (sommeil, agenda…) est isolé dans son module.
- Les agents (jalon 6) trouvent leurs outils dans `agentTools` de chaque module, sans couplage.

**Négatives / risques**
- La migration `lib/` → `src/core/` requiert de mettre à jour tous les imports existants (risque de régression d'import).
  Mitigation : `npm run typecheck` obligatoire après chaque déplacement.
- La structure `src/` à la racine coexiste avec `app/` (Expo Router) ; veiller à ne jamais mettre de routes dans `src/`.

## Règles d'or issues de cette décision

1. Logique déterministe → `src/core/`, jamais dans un composant.
2. L'UI importe depuis `src/data/` (repositories), jamais depuis les mocks ou les adaptateurs.
3. L'IA ne modifie jamais les données directement : elle crée une `Proposal` validée par l'utilisateur.
4. Tout schéma de données = un `ZodSchema` dans `src/core/schemas.ts` (ou dans le manifeste du module).
