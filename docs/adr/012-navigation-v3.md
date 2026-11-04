# ADR-012 — Navigation v3.1 : `Aujourd'hui · Semaine · Coach · Progrès`

- **Date** : 2026-11-04
- **Statut** : Accepté
- **Décideur** : Julien (propriétaire produit)
- **Remplace** : ADR-002 (navigation v2)

---

## Contexte

La navigation v2 (ADR-002) comptait cinq onglets : `Accueil · Plan · Agent · Suivi · Stats`. Le
profil y était déclaré en onglets cachés de `(tabs)`. Elle avait trois défauts :

- **Le temps était éclaté.** Le prévu (Plan) et le fait (Suivi) vivaient dans deux onglets, alors
  qu'une semaine d'entraînement se lit d'un seul regard : ce qui était prévu, ce qui a été fait,
  ce qui reste.
- **Un sélecteur de modules par onglet.** Plan et Suivi ouvraient chacun sur un sélecteur
  Sport / Nutrition / Objectifs : un tap de plus avant toute information, pour une bêta qui
  n'aura qu'un module visible.
- **Des écrans en double.** L'historique complet (`/activities`) répétait le journal de Suivi ;
  le débrief de course (`/race/[id]`) répétait le détail d'activité de la même sortie.

La direction v3.1 (`docs/SPEC-v3.md`, ADR-011) apporte les maquettes d'Aujourd'hui, du Coach, de
Semaine et du détail d'activité, et introduit la **séance** : un groupe d'une ou plusieurs
activités, dérivé par `groupSessions` (`src/core/`). La bêta est limitée au sport.

## Décision

### Quatre onglets, le profil hors onglets

| Onglet | Route | Rôle (une phrase) |
|---|---|---|
| Aujourd'hui | `app/(tabs)/index.tsx` | Ce que je fais maintenant : la parole du coach, la séance du jour, les décisions en attente |
| Semaine | `app/(tabs)/semaine.tsx` | Ma semaine : le prévu et le fait au même endroit, jour par jour |
| Coach | `app/(tabs)/coach.tsx` | La seule porte vers l'IA : je demande, il propose, je valide |
| Progrès | `app/(tabs)/progres.tsx` | Où j'en suis : tendances, volume, courses |

- Le **profil** s'ouvre depuis l'**avatar** d'Aujourd'hui (`size.avatar`). C'est un Stack hors
  `(tabs)` : pas de barre d'onglets, retour natif, aucun onglet « actif » à simuler.
- Quatre onglets au maximum. Un nouveau module ajoute des sections dans Semaine ou Progrès,
  jamais un onglet.

### Structure des routes

```
app/
  _layout.tsx              Stack racine : polices, écran de démarrage, onboarding protégé
  (tabs)/
    _layout.tsx            Tabs : 4 onglets, TabBar v3.1
    index.tsx              Aujourd'hui
    semaine.tsx            Semaine
    coach.tsx              Coach
    progres.tsx            Progrès
  profile/
    _layout.tsx            Stack avec en-tête de retour
    index.tsx              Profil (ouvert par l'avatar)
    modules.tsx            Modules activables
    [section].tsx          objectifs | connexions | apparence | donnees
  activity/[id].tsx        Détail d'une séance (id = Session.id)
  onboarding/index.tsx     Premier lancement (Stack.Protected)
  (dev)/gallery.tsx        Galerie des composants v3.1, __DEV__ seulement
  +not-found.tsx
  +html.tsx
```

- `activity/[id]` reçoit l'identifiant d'une **séance** (`Session.id`, stable, dérivé des ids
  d'activités triés). Un id d'activité seule est résolu vers la séance qui la contient : les
  liens existants ne cassent pas.
- **Course confirmée** : le détail affiche la variante « débrief en trois temps » (temps
  officiel en héros, découpage, comparaison avec les courses précédentes). C'est le même écran,
  pas une route à part.
- `Profil › objectifs` ne porte que l'objectif sportif (niveau, objectif, jours disponibles).
  Poids et calories sortent avec la nutrition.
- `Profil › donnees` accueille le réglage « Ne jamais regrouper » (SPEC-v3, regroupement), ainsi
  que l'**export et la suppression des données**, obligatoires avant la bêta (droits RGPD).

### Correspondance ancien écran → nouvel écran

| Ancien écran | Ancienne route | Nouvel emplacement |
|---|---|---|
| Accueil | `/` | **Aujourd'hui** `/` — sans les widgets nutrition, dîner ni Forme |
| Plan (« Ma semaine ») | `/plan` | **Semaine** `/semaine` — séances prévues, ligne du jour, valider ou reporter ; sans plan : `EmptyState noPlan` → « Créer mon plan avec le coach » |
| Suivi (« Mon journal ») › Sport | `/suivi` | **Semaine** `/semaine` — une ligne par séance faite, au même endroit que le prévu |
| Historique | `/activities` | **Semaine** (semaines passées, chevrons ou balayage) ; les totaux par mois passent dans **Progrès** |
| Stats (« Ma progression ») | `/stats` | **Progrès** `/progres` |
| « Mes courses » (Suivi › Sport › Courses) | `/suivi` | **Progrès** › Courses (passées et à venir) |
| Débrief de course | `/race/[id]` | **Détail d'activité** `/activity/[id]`, variante « débrief en trois temps » |
| Course « À confirmer » | Accueil, Suivi › Sport | `CoachCard` de type `question` sur **Aujourd'hui** ; les plus anciennes dans **Progrès** › Courses |
| Agent | `/agent` | **Coach** `/coach` |
| Détail d'activité | `/activity/[id]` | **Détail d'activité** `/activity/[id]` (une séance) |
| Profil | `/profile` (onglet caché) | `/profile` (Stack, ouvert par l'avatar) |
| Profil › Modules | `/profile-modules` | `/profile/modules` |
| Profil › Objectifs, Connexions, Apparence | `/profile-section?id=…` | `/profile/[section]` |
| Onboarding | `/onboarding` | `/onboarding` (réécrit, bloc sport) |
| Galerie de composants | `/gallery` | `/gallery` (groupe `(dev)`, mêmes conditions `__DEV__`) |

### Ce qui est supprimé, et pourquoi

| Supprimé | Pourquoi |
|---|---|
| **Nutrition** : Plan › Nutrition, Suivi › Nutrition, carte « Ce soir · Dîner », carte calories, feuilles d'ajout et d'édition de repas | Hors bêta : la bêta est limitée au sport. La couche données (`src/data`, store) est conservée et le module reste désactivé par défaut. L'interface est récupérable depuis le tag `pre-v3`. |
| **Scan d'assiette** (`/scan`) | Hors bêta, lié à la nutrition. Récupérable depuis `pre-v3`. |
| **Module Objectifs** (écran « bientôt », objectif de course dans Suivi) | Hors bêta. L'objectif de course déclaré reste lu par le plan et par Progrès › Courses. |
| **Forme / batterie d'énergie** | Aucune donnée réelle fiable avant HealthKit (M4), pas de maquette. Supprimée. |
| **Sélecteur de modules** (Plan, Suivi) | Un seul module visible en bêta. Les modules restent activables dans Profil › Modules et filtrent les sections, sans sélecteur à l'écran. |
| **Historique complet** (`/activities`) | Doublon de Semaine (journal) et de Progrès (totaux par mois). |
| **Route `/race/[id]`** | Doublon du détail d'activité : une course est une séance comme une autre, avec sa variante. |
| **Aperçu des stats** (`/preview-stats`) | Écran de développement, sans lien, qui importe un adaptateur de données directement. |

## Alternatives rejetées

| Alternative | Raison du rejet |
|---|---|
| Garder Plan et Suivi séparés | Le prévu et le fait d'une même semaine se lisent ensemble ; deux onglets doublent les taps. |
| Profil en 5e onglet | Réglage rare : il ne mérite pas une place permanente dans la barre. |
| Débrief de course sur sa propre route | Deux écrans pour la même sortie ; un lien de plus à maintenir. |
| Garder la nutrition visible en bêta, marquée « bêta » | La bêta teste le coach sportif ; une demi-fonction brouille les retours. |

## Conséquences

- **Suppression en deux temps** : l'étape de coquille retire des routes les écrans supprimés ;
  l'ancien code reste dans le dépôt et compilable jusqu'à sa réécriture, puis il est retiré.
- **Liens internes à renommer** : `/agent` → `/coach` (`agentDraft`, cartes d'Aujourd'hui,
  propositions), `/profile-section?id=…` → `/profile/[section]`, `openRace` retiré de
  `src/ui/nav.ts` (et de `nav.test.ts`). Aucun lien profond externe n'existe encore.
- **Registre des modules** : les sections `plans` / `dashboards` / `stats` / `trends` de
  `LifeModule` deviennent `week` / `progress`. `nutrition`, `goals` et `wellness` passent à
  `enabledByDefault: false` (à l'étape de suppression, pas avant).
- **TabBar** : quatre entrées, hauteur `size.tabBar`. Le contournement qui masquait les onglets
  cachés du profil disparaît avec le Stack `profile/`.
- **Une seule porte vers l'IA, inchangée** : la saisie libre n'existe que dans Coach.
  « Modifier » sur une proposition ouvre Coach avec la proposition en contexte (SPEC-v3 §5).
- **Rôles des écrans** (principe 5 de ROADMAP) : Aujourd'hui = maintenant · Semaine = la
  semaine, prévue et faite · Coach = aide · Progrès = tendances.
- **Écrans sans maquette** : Progrès, Profil et ses sous-écrans, Onboarding. Ils seront maquettés
  avant d'être codés, ou dérivés strictement des composants de la SPEC.
- **Ordre de mise en œuvre** (ROADMAP, Refonte v3.1) : coquille de navigation, composants,
  `groupSessions` et source des activités (ADR-013), puis les écrans.
