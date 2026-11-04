# ADR-002 — Navigation v2 : `Accueil · Plan · Agent · Suivi · Stats`

- **Date** : 2026-10-30
- **Statut** : Remplacé par ADR-012
- **Décideur** : Julien (propriétaire produit)

---

## Contexte

La v1 avait quatre onglets par domaine (Aujourd'hui, Sport, Nutrition, Profil). Chaque nouveau module de vie
(sommeil, agenda, objectifs…) aurait imposé un onglet de plus ; la saisie (repas, séance) était dispersée
dans plusieurs écrans, ce qui va à l'encontre du principe « anti-cliquodrome » (ROADMAP).

## Décision

Cinq entrées, dont l'agent au centre :

| Onglet | Route | Rôle |
|---|---|---|
| Aujourd'hui | `app/(tabs)/index.tsx` | Flux d'actions : « Maintenant », bilan kcal, séance validable, propositions, brief |
| Plan | `app/(tabs)/plan.tsx` | Programme, semaine, détail de séance (ex-Sport, sans l'historique) |
| ⊕ Agent | `app/(tabs)/agent.tsx` | `CommandBar` (texte), suggestions, propositions en attente, scan d'assiette |
| Suivi | `app/(tabs)/suivi.tsx` | Sélecteur de module → `dashboards` du module (Sport : historique d'activités ; Nutrition : macros + journal) |
| Stats | `app/(tabs)/stats.tsx` | Tendances par module (période Semaine / Mois / Année), analyse de l'Agent |

**Révision 2026-10-31** : l'onglet « Moi » est remplacé par « Stats ». Le profil s'ouvre depuis le prénom de l'Accueil (`profile`, `profile-modules`, `profile-section` : routes cachées de `(tabs)`, aucun onglet actif). Plan et Suivi utilisent un sélecteur de modules à icônes (`ModuleSwitcher`), généré depuis les modules actifs (`LifeModule.plans / dashboards / stats`) ; les modules s'activent dans Profil › Modules.

- Les onglets **Sport** et **Nutrition** disparaissent. Leurs écrans migrent dans *Suivi* via
  `LifeModule.dashboards` : ajouter un module ne crée jamais d'onglet.
- La **saisie** passe par *Aujourd'hui* (carte « Maintenant », scan) et la `CommandBar` (langage naturel).
- Le bouton Agent est mis en avant (pastille accent) ; les autres onglets gardent la pilule active `bg-fg`.
- Routes hors onglets inchangées : `scan`, `session/[id]`, `activity/[id]`.

## Choix techniques

- `TabBar` utilise `emitter` + `navigateToTab(route.key)` fournis par la navigation, et non plus
  `router.navigate(route.name)`. Le nom de route `index` n'est pas une URL valide : c'était la cause de
  l'écran « Cet écran n'existe pas » au tap sur Accueil.
- `getNowAction` (`src/core/now.ts`) décide de la carte « Maintenant » de façon déterministe et testée.
- `MockAgent.interpretIntent` renvoie des `Proposal` conformes au schéma ; l'IA réelle (J6) remplacera
  le mock derrière la même interface `IAgent`.
- Dictée vocale : pas de module natif ajouté (dépendance lourde, nécessite un development build, J5).
  En attendant, la dictée du clavier système fonctionne dans la `CommandBar`.

## Alternatives rejetées

| Alternative | Raison du rejet |
|---|---|
| Garder Sport / Nutrition en onglets et ajouter l'agent en 5e | 6 onglets dès le 2e module ; ne passe pas à l'échelle |
| Agent en bouton flottant uniquement | Moins découvrable ; pas d'écran pour les propositions en attente |
| Menu hamburger pour les modules | Cache les données ; plus de taps |

## Conséquences

- Les anciennes routes `/sport`, `/nutrition`, `/profil` n'existent plus (aucun lien profond externe à ce stade).
- Les doublons d'affichage sont supprimés (macros en-tête de Nutrition vs « Apports du jour »).
