# PulseFit v3.1 — composants et regroupement des activités

Toutes les valeurs viennent de `theme.ts`. Les textes affichés sont produits en amont
(`src/core/` ou l'agent) : un composant ne calcule rien, ne formate aucun nombre et ne choisit
aucun mot de vocabulaire. Il reçoit des chaînes prêtes.

Règles communes à tous les composants :

- **Donnée manquante = élément absent**, jamais une tuile « — » ou « 0 ». Si l'absence compte
  pour l'utilisateur, elle est dite une fois en phrase (rôle `sub` ou `caption`).
- **Chargement** : squelette à la hauteur finale (pas de saut de mise en page), sans animation
  en boucle ; sous « réduire les animations », squelette fixe.
- **Texte agrandi** : seuil `fontScaleBreakpoints.stack` (1,3) lu via
  `useWindowDimensions().fontScale`. Au-delà, tout ce qui est côte à côte s'empile.
- **Accessibilité** : chaque composant expose un `accessibilityLabel` qui lit la phrase avant
  les chiffres, dans le même ordre que l'écran.

---

## 1. `CoachCard` — la voix du coach

Ce que le coach dit : un constat, une explication, une question.

```ts
type CoachCardProps = {
  kind: 'insight' | 'question' | 'waiting';
  label?: string;              // défaut « Ton coach »
  verdict?: string;            // une phrase, 12 mots max (rôle verdict, bold)
  body: string;                // rôle sub ou body
  certainty?: { approx: true; reason: string }; // « Environ » : la cause, dite une fois
  choices?: { id: string; label: string }[];    // kind 'question' : 2 à 4 réponses en 1 tap
  onChoose?: (id: string) => void;
  source: 'device' | 'ai' | 'profile';
  // device  → « Calculé sur ton téléphone »
  // ai      → « Rédigé par l'IA à partir d'un résumé anonymisé »
  // profile → « Programme établi d'après ton profil »
};
```

**Variantes**
- `insight` : verdict + corps + source.
- `question` : corps + puces (ressenti « Facile · Dure · À fond », zone travaillée en muscu).
  Une fois répondu, la carte se replie en une ligne « Noté : Dure » avec « Changer ».
- `waiting` : sous le seuil de fiabilité (moins de 3 sorties fiables). Pas de chiffre, la
  phrase dit ce qui manque : « Encore 2 sorties et je te dis comment tu progresses. »

**États**
- Chargement : libellé « Ton coach » + deux lignes de squelette.
- Vide : la carte n'est pas rendue. Le coach ne parle pas pour remplir.
- Donnée manquante : bascule en `waiting`, ou ajoute `certainty`.
- Échec de l'IA : repli sur le texte du moteur de règles, `source` passe à `device`. Aucune
  mention d'erreur à l'utilisateur.

**Texte agrandi** : aucun plafond. Le verdict passe sur autant de lignes qu'il faut, les puces
vont à la ligne, la carte grandit et l'écran défile.

---

## 2. `HeroMetric` — le héros et ses chiffres secondaires

Un seul par écran.

```ts
type HeroMetricProps = {
  value: string;               // « 1h53:09 », « 3:42 », « 1h08 » : formaté par core
  unit?: string;               // « /km »
  caption?: string;            // « sur le bloc rapide de 3,3 km »
  metrics?: { label: string; value: string; unit?: string }[]; // 0 à 3
};
```

**Choix du héros (règle de core, pas du composant)** : course → temps si c'est une course
(compétition), allure du bloc principal si c'est une séance structurée, distance sinon ; renfo,
nage, vélo sans structure → durée. Le héros n'est jamais une donnée absente : on descend la
liste jusqu'à une valeur présente.

**Variantes** : avec ou sans unité, avec ou sans trio.

**États**
- Chargement : bloc de 64 de haut + une ligne de légende.
- Donnée manquante : un chiffre secondaire absent n'est pas rendu (le trio devient un duo).
  Trio vide → la rangée disparaît.
- Vide : sans objet (pas d'écran de détail sans activité).

**Texte agrandi**
- Héros plafonné à ×1,25 (80 px) ; `adjustsFontSizeToFit`, `numberOfLines={1}`,
  `minimumFontScale={0.7}`.
- À partir de 1,3 : l'unité passe sous le nombre.
- Chiffres secondaires plafonnés à ×1,5 ; à partir de 1,3 le trio devient une liste verticale
  libellé à gauche / valeur à droite.

---

## 3. `SessionCard` — la séance du jour

```ts
type SessionCardProps = {
  eyebrow: string;             // « Séance du jour », « Ta première séance »
  title: string;               // « Footing 8 km », « 20 minutes, marche et course »
  effort: EffortPillProps;
  instruction: string;         // déjà adaptée au niveau déclaré et aux données disponibles
  note?: string;               // « Pas de cardio sur tes sorties depuis juin… »
  status: 'planned' | 'done' | 'autoValidated' | 'postponed' | 'rest';
  onValidate: () => void;      // appelé à la fin du maintien
  onPostpone: () => void;
  onUndo: () => void;
};
```

**Variantes** : `planned`, `rest` (jour de repos : titre « Repos », pas de maintien, une
ligne sur ce que le repos prépare), débutant (titre en minutes, aucune allure).

**États**
- `planned` : piste de maintien vide + « Maintiens la carte pour valider » + lien « Reporter ».
- Maintien en cours : la piste se remplit en `motion.hold` (600 ms), retour haptique léger au
  début, net à la fin. Relâcher avant la fin → la piste revient à zéro.
- `done` : carte repliée « Séance validée », bandeau « Annuler » pendant `motion.undo`.
- `autoValidated` : « Validée par ta montre » + « Annuler » permanent dans la journée.
- `postponed` : « Reportée à demain » + « Annuler ».
- Chargement : squelette à la hauteur de `planned`.
- Vide (pas de plan) : on rend `EmptyState` à la place, pas une carte vide.
- Donnée manquante : pas de FC → `instruction` en allure et sensation (rôle de core),
  `note` une seule fois par semaine, pas à chaque séance.

**Accessibilité** : `accessibilityActions={[{ name: 'activate', label: 'Valider la séance' }]}`.
Un double-tap VoiceOver ou TalkBack valide sans maintien. Sous « réduire les animations », la
piste n'est plus animée et le maintien reste à 600 ms.

**Texte agrandi** : aucun plafond ; la pastille d'effort passe sous le titre à partir de 1,3.

---

## 4. `EffortPill` — l'intensité

```ts
type EffortPillProps =
  | { level: 'easy' | 'moderate' | 'hard' }  // mot fixe : « Facile » · « Correct » · « Dur » (échelle de l'ADR-013)
  | { level: 'neutral'; label: string };    // « Renfo », « Sans cardio »
```

**Variantes** : trois niveaux d'effort colorés (point + mot, jamais la couleur seule) ;
`neutral` pour ce qui n'a pas d'intensité lisible (renfo, pas de cardio).

**États** : pas de chargement (la pastille arrive avec sa carte). Donnée manquante → `neutral`
avec un mot qui dit pourquoi (« Sans cardio »), jamais une pastille grise muette.

**Texte agrandi** : plafonné à ×1,5. `size.pill` est une hauteur minimale, pas fixe : la
pastille grandit avec le texte et peut passer à la ligne.

---

## 5. `ProposalCard` — une décision à prendre

```ts
type ProposalCardProps = {
  context: string;             // « Plan · samedi 7 nov. »
  title: string;               // « Sortie longue : 16 → 12 km »
  before?: string;             // absent pour une création → « Rien de prévu »
  after: string;
  rationale: string;           // une phrase, des faits vérifiables
  confidence: 'high' | 'medium' | 'low'; // affichée en mots seulement si ≠ high
  source: 'device' | 'ai';
  status: 'pending' | 'applying' | 'accepted' | 'rejected' | 'stale' | 'failed';
  compact?: boolean;           // sur Aujourd'hui : sans avant/après, avec la source
  onAccept: () => void;
  onEdit: () => void;          // ouvre Coach avec la proposition en contexte
  onReject: () => void;
};
```

**Variantes** : complète (Coach) et compacte (Aujourd'hui).

**États**
- `pending` : « Valider » (plein, 1 tap) + « Modifier » (contour). Refuser = glisser la carte
  ou « Pas maintenant » dans le menu.
- `applying` : boutons désactivés, libellé « Valider » remplacé par un indicateur discret.
- `accepted` / `rejected` : la carte se retire, bandeau « Annuler » pendant `motion.undo`.
- `stale` : les données ont changé depuis → « Plus à jour : je recalcule. » Boutons masqués.
- `failed` : « Pas appliqué. Réessayer » ; la carte reste.
- Chargement : squelette ; le compteur « À décider » n'apparaît qu'une fois chargé.
- Vide : aucune carte. Dans Coach, pas de titre « À décider » quand il n'y a rien.

**Texte agrandi** : aucun plafond. À partir de 1,3, avant et après s'empilent, puis les
boutons s'empilent (plein au-dessus).

---

## 6. `EmptyState` — l'absence comme état

```ts
type EmptyStateProps = {
  reason: 'firstDay' | 'noPlan' | 'noImport' | 'belowThreshold' | 'restWeek';
  title: string;               // « Rien d'importé cette semaine. »
  body: string;                // pourquoi, sans culpabiliser
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
};
```

**Variantes par raison**
- `firstDay` : débutant, aucune donnée. Une séance, pas de chiffre.
- `noPlan` : pas de plan → « Créer mon plan avec le coach » + modèles.
- `noImport` : semaine sans activité importée → « J'ai couru sans montre » / « C'était une pause ».
- `belowThreshold` : données insuffisantes pour une tendance → ce qui manque, en nombre de sorties.
- `restWeek` : pause déclarée → aucune action, une phrase sur la reprise.

**États** : c'est lui-même un état ; pas de chargement propre (on ne l'affiche qu'une fois la
requête terminée et vide, jamais pendant le chargement).

**Règle** : jamais de « 0 », de « 0/3 » ni de pourcentage ; au plus un bouton plein.

**Texte agrandi** : aucun plafond ; les deux boutons sont déjà empilés.

---

## Mouvement
Principe : le mouvement explique un changement d'état. Sans lui, l'écran reste compréhensible.
Jetons (theme.ts → motion) : fast 150 ms (pression, contrôle) · base 250 ms (apparition,
bandeau) · slow 400 ms (compteur, carte qui se replie) · hold 600 ms (validation par maintien,
un geste et non une animation) · easing Easing.out(Easing.cubic) partout · spring damping 18,
stiffness 220, uniquement pour la coche de validation.
Navigation : transitions natives du Stack pour le détail et le profil. Aucune animation
entre onglets.
Chiffres : compteur seulement pour les quantités cumulées (durée, km), une fois à l'arrivée.
Temps, allures et records en fondu. Le lecteur d'écran lit la valeur finale.
Validation par maintien : piste horizontale, haptique au début et à la fin, coche en spring,
relâcher annule. Réduire les animations : le geste reste, la piste passe à pleine.
Accessibilité : action « Valider » sans maintien.
Bandeau « Annuler » (5 s) : pause au toucher. Avec lecteur d'écran, pas de disparition
automatique, et le bandeau est annoncé. L'annulation reste possible toute la journée depuis
l'historique du Coach.
Chargement : squelettes fixes après 300 ms d'attente, affichés au moins 300 ms.
Halo d'Aujourd'hui : statique.
Réduire les animations : fondu fast ou instantané, le retour haptique reste.

---

# Regroupement des activités en séances

## Ce que les maquettes supposent

Une **séance** est un objet dérivé : un groupe d'une ou plusieurs activités. Les activités
restent la source de vérité et ne sont jamais modifiées. Le regroupement est une fonction pure
de `src/core/`, rejouée à chaque import :

```ts
groupSessions(activities: Activity[], overrides: GroupOverride[]): Session[]

type Session = {
  id: string;                  // stable : dérivé des ids d'activités triés
  activityIds: string[];       // dans l'ordre chronologique
  roles: Record<string, 'warmup' | 'main' | 'cooldown'>;
  origin: 'auto' | 'manual';
  ruleVersion: number;
};

type GroupOverride =
  | { type: 'split'; activityIds: string[] }   // ne plus jamais regrouper ces activités
  | { type: 'merge'; activityIds: string[] }   // regroupement forcé par l'utilisateur
  | { type: 'role'; activityId: string; role: 'warmup' | 'main' | 'cooldown' };
```

## La règle (version 1)

Deux activités consécutives A puis B appartiennent à la même séance si **toutes** ces
conditions sont vraies :

1. **Même famille de sport** (course avec course). Jamais nage + course ou vélo + course :
   l'enchaînement multisport viendra avec le triathlon.
2. **Écart court** : entre la fin de A et le début de B, 15 minutes au plus.
3. **Même jour local**, et une séance ne dépasse pas 4 heures de bout en bout.
4. **Pas de doublon** : la déduplication des imports (même activité venue de deux sources)
   passe avant le regroupement.
5. **Aucun override `split`** sur ces activités.

Les rôles se déduisent ensuite : le bloc **principal** est l'activité la plus intense (allure
la plus rapide, ou FC moyenne la plus haute quand elle existe). Ce qui le précède est un
**échauffement**, ce qui le suit un **retour au calme**. Le titre de l'activité (« Échauffement »,
« Déchauffement ») ne sert que d'indice de départage, jamais de critère seul.

Un groupe d'une seule activité est une séance d'une activité : c'est le cas le plus courant.

Le 20 mai : échauffement 2,0 km (5:17 /km), bloc 3,3 km (3:42 /km), retour 2,6 km (6:37 /km),
même sport, même midi → une séance de 7,9 km et 40:05. Les écarts entre activités ne sont pas
dans tes captures : vérifie le seuil de 15 minutes sur tes 166 activités avant de le figer.

## Ce que ça change

| | Avant (activités) | Après (séances) |
|---|---|---|
| **Compteur de séances** | 3 le 20 mai, 7 la semaine du 18 mai | 1 le 20 mai, **5** la semaine du 18 mai. L'appariement avec le plan se fait aussi par séance : une séance prévue « VO2 » est validée par le groupe entier. |
| **Volume hebdomadaire** | Somme des activités | **Inchangé.** Le volume additionne déjà chaque activité une fois : 4 h 03 la semaine du 18 mai, 4:50:02 en mai, avant comme après. Les pauses entre activités ne sont pas comptées (40:05, pas l'écart entre le début et la fin). Charge et km par sport se calculent toujours sur les activités. |
| **Liste du journal** | 3 lignes | **1 ligne** « VO2 max · 7,9 km · 40:05 » avec une légende « 3 activités ». Le détail montre les trois temps et un lien « Voir les 3 activités d'origine ». |
| **Records et meilleurs efforts** | Par activité | Inchangés : ils restent calculés sur les activités, jamais sur la séance. |

Seule la notion de « séance » change : compteur, régularité, appariement avec le plan, titre
et héros du détail. Tout ce qui se mesure en temps, en distance ou en charge reste sur les activités.

## Si le regroupement se trompe

- **Regroupé à tort** : dans le détail de la séance, « Séparer » → override `split`. Les
  activités redeviennent indépendantes et la règle ne les regroupera plus, même après un
  nouvel import. Bandeau « Annuler ».
- **Pas regroupé alors qu'il aurait fallu** : dans le journal, appui long sur une activité →
  « Regrouper avec la précédente » ou « avec la suivante » → override `merge`. Proposé seulement
  si les deux activités sont le même jour.
- **Mauvais rôle** (le retour au calme pris pour le bloc principal) : dans le détail, toucher
  un des trois temps → « C'était l'échauffement / le bloc / le retour au calme » → override
  `role`. Le héros et le verdict se recalculent.
- **Ne jamais regrouper** : réglage dans Profil › Données, qui désactive la règle sans toucher
  aux overrides `merge` déjà posés.

Les overrides sont stockés à part, avec les ids d'activités : changer la règle (`ruleVersion`)
ne les efface jamais. PulseFit n'écrit rien vers Strava ni vers Apple Santé : le regroupement
n'existe que dans l'app.
