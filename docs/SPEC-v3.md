# PulseFit v3.1 — écrans, composants et regroupement des activités

**Maquettes de référence** : `docs/maquettes/v3.4/` (direction artistique v3.1, écrans v3.4, clair
et sombre côte à côte). Les fichiers `*-pleine-hauteur.png` montrent l'écran entier défilé. En cas
de doute, **la capture fait foi** : on fait tout comme les écrans des maquettes. Les points non
maquettés sont tranchés dans `docs/questions.md`.

| Fichier | Écran |
|---|---|
| `001-Direction` | Planche de direction : échelle typographique, texte agrandi, couleurs, niveau déclaré |
| `102-Aujourdhui` | Aujourd'hui, « Je m'entraîne » (séance du jour + proposition compacte) |
| `105-VideDebutant` | Aujourd'hui, « Je débute », premier jour |
| `103-Coach` | Coach : à décider, conversation, suggestions, saisie |
| `214-CoachModif` | Coach : proposition à plusieurs lignes avec question, puis appliquée + « Annuler » |
| `104-Semaine` | Semaine, « Je m'entraîne » : prévu jour par jour, semaines passées |
| `215-ProfilNiveau` | Semaine « Je débute » (séances validées et ressenti) + détail d'une séance saisie à la main |
| `109-VideSemaine` | Semaine passée sans import |
| `106-ActiviteFC` | Détail d'une séance regroupée avec cardio (VO2 max, trois temps) |
| `107-ActiviteSansFC` | Détail d'une course sans cardio (semi, quatre quarts, ressenti) |
| `108-ActiviteMuscu` | Détail d'une séance de renfo (zone travaillée, semaine en barres) |
| `211-Progres2` | Progrès « Mois » (volume, régularité, semis) + Progrès sous le seuil |
| `212-Debrief` | Débrief de course « Ta course en trois temps », sans puis avec cardio |
| `213-ProfilDonnees` | Profil (modale) + Profil › Données |
| `210-Onboarding` | Onboarding en quatre étapes |
| `216-OnboardingStrava` | Onboarding, étape 4, quand les séances arrivent par Strava |

Navigation et routes : ADR-012 et son amendement du 2026-11-08.

Toutes les valeurs viennent de `theme.ts`. Les textes affichés sont produits en amont
(`src/core/` ou l'agent) : un composant ne calcule rien, ne formate aucun nombre et ne choisit
aucun mot de vocabulaire. Il reçoit des chaînes prêtes.

## Direction (planche `001`)

- **Phrase d'abord, chiffre ensuite** : chaque écran commence par ce que les données veulent dire.
- **Échelle fermée** : six tailles (`hero` 64 · `title` 32 · `verdict` 22 · `body` 17 · `sub` 15 ·
  `caption` 13), trois graisses (400 · 600 · 700), trois rayons (24 cartes · 16 boutons, champs et
  blocs internes · 999 pastilles, puces, avatar), espacements 4 · 8 · 12 · 16 · 20 · 24 · 32,
  marges d'écran 20. Inter Tight pour héros, titre et verdict ; Inter pour le reste.
- **Couleur** : *l'indigo, c'est le coach qui parle* (libellé « ✦ Ton coach », bloc « Après »,
  bouton de dictée, barre mise en avant) ; *vert, ambre, corail : l'effort* ; le reste en encre.
  Un seul bouton plein (encre) par écran.
- **Contraintes Expo** : aucune transparence floutée (`backdrop-filter`) ni dégradé conique.
  Surfaces opaques et liseré d'un pixel au lieu d'ombres. Le halo Aurore est un simple dégradé
  linéaire (`expo-linear-gradient`), en haut d'Aujourd'hui seulement.

## Niveau déclaré

Le niveau est choisi à l'onboarding (étape 1) et modifiable dans Profil. **Il fixe la densité et
les mots ; les données ne font que retirer** ce qu'on ne peut pas savoir, elles ne changent jamais
le niveau. Les textes sont produits par `src/core/` selon ce tableau (planche `001`, §04).

| | « Je débute » | « Je cours un peu » | « Je m'entraîne » |
|---|---|---|---|
| Facile | Tu dois pouvoir parler | Allure footing | Z1–Z2 · sous 150 bpm |
| Soutenu | Tu parles par bribes | Allure semi | Z3 · 150 à 165 bpm |
| Intense | Tu ne peux plus parler | Allure 5 km | Z4–Z5 · au-dessus de 165 bpm |
| Héros d'Aujourd'hui | La séance en minutes | La séance en km | La séance en km et sa place dans la semaine |
| Détail d'activité | Durée, ressenti, régularité | + distance, allure, quarts | + FC, zones, charge, séance reconstituée |
| Progrès | Semaines actives | Km et sorties | Charge, prédictions en fourchette |

Sans cardio, « Je m'entraîne » garde sa densité mais perd les bpm : la consigne passe à l'allure et
à la sensation (« 5:30 à 5:45 /km, tu dois pouvoir parler »).

## Deux échelles d'effort

- **Intensité prévue** d'une séance (Semaine, Aujourd'hui, détail) : « **Facile · Soutenu ·
  Intense** ».
- **Ressenti déclaré** après la séance (ADR-013) : « **Facile · Correct · Dur** ».

Les deux partagent les couleurs `effortEasy` / `effortModerate` / `effortHard` (vert, ambre,
corail). Sur une séance faite, la pastille montre le ressenti s'il existe, sinon l'intensité.

Règles communes à tous les composants :

- **Donnée manquante = élément absent**, jamais une tuile « — » ou « 0 ». Si l'absence compte
  pour l'utilisateur, elle est dite une fois en phrase (rôle `sub` ou `caption`). Seule
  exception : dans un graphique en barres, une période sans séance est un trait plat surmonté de
  « — » (`211`, Q4).
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
  label?: string;              // défaut « Ton coach » ; aussi « Ton coach · 08:13 »,
                               // « La prochaine fois », « Pour ton 1h45 », « Ta plus grosse semaine de mai »
  source: 'device' | 'ai' | 'profile';
  // device  → « Calculé sur ton téléphone »
  // ai      → « Rédigé par l'IA »
  // profile → « Programme établi d'après ton profil »
  approxReason?: string;       // « Environ » : la cause, dite une fois
  showSource?: boolean;        // défaut true ; false sur le détail d'une séance (jamais pour 'ai')
} & (
  | { kind: 'insight'; verdict: string; body?: string }
  | { kind: 'advice'; verdict: string; body: string; action?: { label: string; onPress: () => void } }
  | { kind: 'question'; body: string; choices: { id: string; label: string; effort?: EffortLevel }[];
      selected?: string; onChoose: (id: string) => void }
);
```

**Variantes**
- `insight` : verdict (rôle `verdict`, bold) + corps + source. Ex. « Un vrai bloc de VO2. » (`106`),
  « Je ne te connais pas encore. » (`105`). Une réponse courte du Coach peut tenir dans le corps
  seul, en `body` semibold (`103`).
- `advice` : verdict + corps + action en lien souligné (« Voir la semaine », `214`).
- `question` : phrase (début en semibold : « **Je vois ton allure, pas ton effort.** Comment tu
  l'as sentie ? », `107`) + 2 à 4 puces en un tap. Ressenti : « Facile · Correct · Dur » avec le
  point de couleur de l'effort ; zone travaillée en renfo : « Haut du corps · Jambes · Tout le
  corps · Gainage » en grille 2 × 2, légende « Facultatif · … » (`108`). Une fois répondu, la puce
  choisie reste affichée sur le fond de son effort et une autre puce peut être touchée (`215`).
- Sous le seuil de fiabilité : ce n'est plus une variante de `CoachCard`, c'est
  `EmptyState firstSessions` (§6).

**Ligne de source** : affichée en bas de la carte partout, **sauf sur le détail d'une séance**
(`106`–`108`, Q3), où tout est calculé sur le téléphone : la carte n'y porte que `approxReason`
s'il existe. Exception à l'exception : un texte rédigé par l'IA porte toujours « Rédigé par
l'IA », y compris sur le détail (`showSource={false}` refusé quand `source === 'ai'`).

**États**
- Chargement : libellé « Ton coach » + deux lignes de squelette.
- Vide : la carte n'est pas rendue. Le coach ne parle pas pour remplir.
- Donnée manquante : ajoute `approxReason` (« « Environ » : ta FC max est la plus haute vue
  (201 bpm), pas une mesure en test. »), ou cède la place à `EmptyState firstSessions`.
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

**Variantes** : avec ou sans unité, avec ou sans trio. Exemples des maquettes :
- `106` VO2 : « 3:42 /km » · « sur le bloc rapide de 3,3 km » · Bloc 12:03 · FC moy. 185 bpm · FC max 201 bpm.
- `107` semi : « 1h53:09 » · « 21,1 km officiels · 5:22 /km · 3e de tes 4 semis », puis en `sub` :
  « Ton téléphone a mesuré 21,88 km (+3,7 %). » ; pas de trio (pas de cardio).
- `108` renfo : « 1h08 » · « Ta 4e séance de la semaine » · duo FC moy. / FC max, suivi d'une phrase
  qui dit que la FC ne juge pas la séance.
- `215` débutant : « 20 min » · « comme prévu · validée à 18:40 », lien « Corriger la durée ».
- `211` Progrès : « 4h50 » · « d'entraînement · 6 séances » (héros dans une carte).

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
  note?: string;               // « Pas de cardio sur tes sorties depuis juin… »,
                               // « Pas besoin de montre : dis-moi juste quand c'est fait. »
  status: 'planned' | 'done' | 'autoValidated' | 'postponed' | 'rest';
  onValidate: () => void;      // appelé à la fin du maintien
  onPostpone: () => void;
  onUndo: () => void;
};
```

**Variantes** : `planned`, `rest` (jour de repos : titre « Repos », pas de maintien, une
ligne sur ce que le repos prépare), débutant (`105` : titre en minutes, aucune allure, « Maintiens
la carte quand c'est fait » et « Plus tard » au lieu de « Reporter »). Les libellés viennent de core
selon le niveau déclaré.

**États**
- `planned` : piste de maintien vide + « Maintiens la carte pour valider » + lien « Reporter ».
- Après le maintien, le ressenti est demandé (« Facile · Correct · Dur ») : c'est la seule mesure
  d'une séance sans montre (`215`). Rien n'est lu automatiquement pour un niveau 0.
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
  | { level: 'easy' | 'moderate' | 'hard'; scale: 'planned' | 'felt' }
    // planned → « Facile » · « Soutenu » · « Intense » (intensité prévue)
    // felt    → « Facile » · « Correct » · « Dur »     (ressenti, ADR-013)
  | { level: 'neutral'; label: string };    // « Renfo », « Sans cardio », « Prévu »
```

**Variantes** : trois niveaux d'effort colorés (point + mot, jamais la couleur seule), sur deux
échelles (voir « Deux échelles d'effort ») ; `neutral` sans point pour ce qui n'a pas d'intensité
lisible (renfo, pas de cardio) ou une séance à venir du programme débutant (« Prévu », `215`).
Aujourd'hui, le code n'a que l'échelle du ressenti : l'échelle `planned` est à ajouter.

**États** : pas de chargement (la pastille arrive avec sa carte). Donnée manquante → `neutral`
avec un mot qui dit pourquoi (« Sans cardio »), jamais une pastille grise muette.

**Texte agrandi** : plafonné à ×1,5. `size.pill` est une hauteur minimale, pas fixe : la
pastille grandit avec le texte et peut passer à la ligne.

---

## 5. `ProposalCard` — une décision à prendre

```ts
type ProposalCardProps = {
  context: string;             // « Plan · samedi 7 nov. » (à droite de l'en-tête)
  eyebrow?: string;            // « À décider · 1 » (Coach), « Je propose » (réponse du coach),
                               // « Ton coach propose » (compacte, Aujourd'hui) — en indigo, avec ✦
  badge?: string;              // pastille à droite à la place du contexte : « En attente », « ✓ Appliqué »
  title: string;               // « Sortie longue : 16 → 12 km », « Fractionné : jeudi → mardi »
  rows: { day: string; before?: string; after: string }[];
                               // 1 ligne → deux blocs Avant / Après côte à côte ;
                               // plusieurs → tableau jour · Avant · Après (`214`) ;
                               // before absent pour une création → « Rien de prévu »
  rationale: string;           // une phrase, des faits vérifiables
  verified?: boolean;          // « Vérifié par le plan : jeudi reste libre, … » (core/planValidator)
  question?: { prompt: string; choices: { id: string; label: string }[];
               selected?: string; onChoose: (id: string) => void };
                               // question obligatoire : Valider indisponible tant qu'elle est sans réponse
  confidence?: 'high' | 'medium' | 'low'; // affichée en mots seulement si ≠ high
  source: 'device' | 'ai';
  status: 'pending' | 'applying' | 'applied';
  compact?: boolean;           // sur Aujourd'hui : sans tableau, avec la source
  onAccept: () => void;
  onEdit: () => void;          // ouvre Coach avec la proposition en contexte
  onReject?: () => void;
  onOpenPlan?: () => void;     // appliquée : lien « Voir la semaine »
};
```

**Variantes**
- Complète (Coach, `103`) : en-tête « À décider · 1 » + contexte, titre, Avant barré sur
  `surfaceSunken` / Après sur `coachSurface`, raison, Valider + Modifier.
- Compacte (Aujourd'hui, `102`) : « ✦ Ton coach propose », titre, raison avec les faits (« Semaine
  du 19 octobre : une sortie de 2,8 km… »), Valider + Modifier, source en légende.
- Avec question (`214`) : tableau de plusieurs jours, question et puces (« Garder mercredi ·
  Dimanche · Le sauter »), ligne « Vérifié par le plan », Valider grisé jusqu'à la réponse. La
  réponse choisie s'affiche ensuite comme une bulle de l'utilisateur.

**États**
- `pending` : « Valider » (plein, 1 tap) + « Modifier » (contour). Refuser = glisser la carte
  ou « Pas maintenant » dans le menu.
- `applying` : boutons désactivés, libellé « Valider » remplacé par un indicateur discret.
- `applied` (`214`) : la carte devient la réponse du coach : « Ton coach · 08:13 » + pastille
  « ✓ Appliqué », verdict (« Fractionné demain, mardi 3. »), ce qui bouge, lien « Voir la semaine »,
  légende « Annulable toute la journée depuis l'historique. » ; bandeau `UndoToast` « Plan
  modifié · Annuler » au-dessus de la saisie pendant `motion.undo`.
- Refusée : la carte se retire, bandeau « Annuler » pendant `motion.undo`.
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
  reason: 'firstDay' | 'noPlan' | 'noImport' | 'firstSessions' | 'restWeek' | 'noAi';
  title: string;               // « Rien d'importé cette semaine. », « Ta progression arrive. »
  body: string;                // pourquoi, sans culpabiliser
  primary?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  caption?: string;            // « « Sans montre » ouvre le coach : dis « 30 minutes samedi » et c'est noté. »
  progress?: { remaining: string; done: string[] }; // firstSessions : cercles + « Encore 2 séances »
};
```

**Variantes par raison**
- `firstDay` : débutant, aucune donnée. Une séance, pas de chiffre (`105`).
- `noPlan` : pas de plan → « Créer mon plan avec le coach » + modèles.
- `noImport` (`109`) : semaine sans activité importée → « J'ai couru sans montre » (plein, ouvre
  le Coach) / « C'était une pause » (contour), légende sous les boutons.
- `firstSessions` (`211`, Progrès) : sous le seuil (3 séances pour la régularité, 6 pour les
  progrès) → « Ta progression arrive. », une rangée de cercles (pleins = faites) et « Encore 2
  séances ». Remplace `belowThreshold`.
- `restWeek` : pause déclarée → aucune action, une phrase sur la reprise.
- `noAi` : le coach IA n'est pas activé → ce que l'IA apporterait, lien vers Profil.

**États** : c'est lui-même un état ; pas de chargement propre (on ne l'affiche qu'une fois la
requête terminée et vide, jamais pendant le chargement).

**Règle** : jamais de « 0 », de « 0/3 » ni de pourcentage ; au plus un bouton plein.

**Texte agrandi** : aucun plafond ; les deux boutons sont déjà empilés.

---

## 7. Composants complémentaires

Mêmes règles communes. « Existe » : déjà dans `src/ui/` ; « À créer » : demandé par les maquettes.

| Composant | État | Rôle et maquette |
|---|---|---|
| `Button` | Existe | Plein (encre, un par écran) · contour (`size.outline`) · lien souligné. Désactivé : `surfaceSunken`, texte `inkTertiary` (`210` étape 4, `214`). |
| `Chip` | Existe | Puce contour, `radius.pill`, hauteur `buttonCompact` : suggestions du Coach, réponses aux questions. Choisie : fond de l'effort ou `coachSurface`. |
| `Composer` | Existe | Seule saisie libre : champ « Demande à ton coach… » + bouton de dictée rond plein `coach` ; puces de suggestion au-dessus (« Décale jeudi », « Pourquoi 12 km ? »). |
| `UserBubble` | Existe | Message de l'utilisateur à droite, fond `surfaceSunken`, horodatage en légende « Toi · hier, 21:14 ». |
| `UndoToast` | Existe | Bandeau encre (couleurs inversées) : message + « Annuler » souligné, piste `coach` qui se vide sur `motion.undo` (`214`). |
| `SessionParts` | Existe | « La séance en trois temps » + total ; barre segmentée proportionnelle (échauffement vert, bloc corail, retour vert pâle) ; trois lignes, le bloc en semibold (`106`). |
| `RaceBands` | Existe | « Ta course en quatre quarts », légende « plus long = plus vite », une barre par quart ; le plus rapide en `coach` et semibold (`107`). |
| `BackHeader` | À créer | « ‹ Semaine », « ‹ Cette semaine », « ‹ Profil » : retour en texte `body` semibold, sans titre centré ; « Fermer » à droite pour la modale du profil. |
| `ScreenHeader` | À créer | Titre `title` + phrase de rôle en `body` secondaire (« Prévu et fait, jour par jour. ») + action en lien souligné à droite (« Historique »). Sur Aujourd'hui : surtitre (date · phase), « Bonjour, Jul », avatar. |
| `SourceChip` | À créer | Pastille neutre en haut à droite du détail : appareil et canal (« COROS, via Strava », « Téléphone, via Strava », « Strava », « Saisie à la main ») — `device` et `source` de l'ADR-013. |
| `WeekList` | À créer | Carte de sept lignes `DayRow` : jour court + date, titre, sous-ligne, pastille. Ligne du jour sur `surfaceSunken` avec « Aujourd'hui » ; repos en `inkSecondary` ; proposition en attente en indigo (« Le coach propose 12 km »). Débutant : cercle coché / vide à gauche, « Fait · ressenti facile » (`104`, `215`). |
| `PastWeekRow` | À créer | Période + résumé (« 19 – 25 oct. · 1 sortie, 15 min »), une ligne de détail ou « Rien d'importé », chevron ; ouvre la semaine passée (`104`). |
| `DayDots` | À créer | Rangée de cercles par jour : vide = rien, plein = fait, contour encre = aujourd'hui. Sept jours avec dates (`109`) ou seulement les jours prévus (« Ta semaine » : Lun · Mer · Sam, `105`). |
| `WeekBars` | À créer | Histogramme L…D, jour courant en encre, autres en `barNeutral`, jour vide en trait plat ; légende par sport sous le graphique (`108`). |
| `PeriodCard` | À créer | Carte Progrès : période et chevrons ‹ ›, `HeroMetric`, barres par semaine avec valeur au-dessus (la plus forte en encre, « — » sur un trait plat pour une semaine vide), répartition par sport, phrase de régularité en tête semibold (`211`). |
| `SegmentedControl` | À créer | « Semaine · Mois · Année », segment choisi plein encre (`211`). |
| `RaceList` | À créer | « Tes semis » + « écart à ton record » : date · ville, allure · « sans cardio », temps à droite et écart dessous ; le record porte une pastille encre « Record » (`211`). |
| `PaceSteps` | À créer | Graphique du débrief : allure en marches sur la distance (« ↑ plus vite », moyenne en tirets fins), repères numérotés 1-2-3 en `coach`, FC en pointillé et objectif en tirets `coach` quand ils existent ; bornes « km 0 · km 10,5 · km 21,1 » (`212`). |
| `NumberedList` | À créer | Les trois temps du débrief : pastille numérotée `coach`, titre semibold avec allures et bpm, phrase en `sub` (`212`). |
| `OptionCard` | À créer | Carte radio de l'onboarding et des écrans de choix du profil : titre semibold, description, rond à droite ; choisie = contour encre épais (`210`). |
| `StepHeader` | À créer | « ‹ 2 sur 4 » + barre segmentée (`210`). |
| `ConsentBlock` | À créer | Bloc `surfaceSunken` : « **Ce qui part :** … **Jamais :** … » + bascule « J'accepte cet envoi » (`210` étape 4). |
| `SettingsGroup` | À créer | Titre de section en légende (« Toi », « Personnalisation ») + carte de lignes : libellé / valeur à droite, sous-ligne d'alerte (« Aucune FC reçue depuis juin. C'est voulu ? »), bascule ou chevron (`213`). |

---

# Écrans

Tous les écrans : fond `bg`, marges `space.screen`, cartes `surface` à liseré, barre d'onglets
visible sauf profil, onboarding et galerie. Le texte vient de `src/core/` selon le niveau déclaré.

## Aujourd'hui (`102`, `105`)
1. Halo linéaire en haut ; surtitre « Lundi 2 novembre · phase de base » (ou « premiers pas,
   jour 1 ») ; titre « Bonjour, Jul » ; avatar (initiale, `size.avatar`) à droite → profil.
2. `SessionCard` du jour (ou repos, ou `EmptyState`).
3. `ProposalCard` compacte s'il y a une décision en attente — **ou**, sans décision, la
   `CoachCard` du moment (« Je ne te connais pas encore. »).
4. Débutant : carte « Ta semaine » (`DayDots` des jours prévus + « Le but cette semaine : revenir
   trois fois. La vitesse viendra après. »).

Pas de `HeroMetric` : la séance du jour tient lieu de héros (en minutes, en km, ou en km avec sa
place dans la semaine selon le niveau).

## Semaine (`104`, `215`, `109`)
1. `ScreenHeader` « Semaine » · « Prévu et fait, jour par jour. »
2. Ligne de période : « 2 – 8 nov. · phase de base » (semibold) et, à droite, l'objectif ou le
   compte (« semi des Lions, J-160 », « 3 séances »).
3. `WeekList` de la semaine en cours. Toucher une séance faite → détail. Une séance prévue ou un
   repos n'est **pas touchable** (Q6) : on la valide ou la reporte depuis Aujourd'hui, on la
   modifie en le demandant au Coach.
4. Débutant : légende « Tu valides chaque séance en maintenant sa carte, avec ton ressenti. Rien
   n'est lu automatiquement. »
5. « Avant » : carte de `PastWeekRow` (ou « C'est ta première semaine. »).
6. **Semaine passée** (empilée, « ‹ Cette semaine ») : surtitre « Semaine passée », titre de
   période, `DayDots` sur sept jours avec dates, puis le contenu de la semaine ou `EmptyState
   noImport` suivi d'une `CoachCard` (« Je ne change rien à ton plan pour l'instant… »).

## Détail d'une séance (`106`, `107`, `108`, `215`)
En-tête commun : `BackHeader` vers l'onglet d'origine ; surtitre (date · moment ou « 3 activités
regroupées ») avec `SourceChip` à droite ; titre (nom de la séance) avec `EffortPill` à droite.
Ensuite, selon la séance (le choix est une règle de core) :

| Séance | Contenu après l'en-tête |
|---|---|
| Structurée avec cardio (`106`) | `HeroMetric` allure du bloc + trio · `CoachCard` (avec `approxReason`) · `SessionParts` |
| Course sans cardio (`107`) | Citation de la description entre guillemets · `HeroMetric` temps officiel + phrase de mesure · `CoachCard` · `RaceBands` · `CoachCard question` ressenti |
| Renfo (`108`) | `HeroMetric` durée + duo FC + phrase « la FC dit peu » · question « Qu'as-tu travaillé ? » · `CoachCard` « Ta plus grosse semaine de mai » avec `WeekBars` |
| Saisie à la main, débutant (`215`) | `HeroMetric` minutes + « comme prévu · validée à 18:40 » · consigne · lien « Corriger la durée » · carte « Ton ressenti » · `CoachCard` source `profile` |

« Séparer » (regroupement à tort) et le choix du rôle d'un temps restent dans ce détail (voir
« Si le regroupement se trompe »).

## Débrief de course (`212`)
Ouvert directement par une ligne de Progrès › Tes semis, onglet Progrès actif ; le retour porte le
nom de la course (« ‹ Semi de Reims », « ‹ Semi de Reims 2025 ») et ramène à Progrès (Q2). Le
détail d'une course (`107`) n'a pas de lien vers le débrief. Surtitre « Débrief · dim. 11 oct. 2026 ·
1h53:09 », titre « Ta course en trois temps », légende du graphique et « moy. 5:22 » ; `PaceSteps` ;
`NumberedList` Départ · Milieu · Final (ou Dernier quart) ; `CoachCard` « La prochaine fois » ou
« Pour ton 1h45 » avec en légende la distance officielle et la distance mesurée. Allures toujours
calculées sur la distance officielle.

## Coach (`103`, `214`)
1. `ScreenHeader` « Coach » · « Tu demandes, il prépare, tu valides. » · lien « Historique ». La
   phrase de rôle disparaît dès qu'une conversation est en cours (`214`).
2. `ProposalCard` complète en tête s'il y a une décision (« À décider · N »).
3. Fil : `UserBubble`, réponses en `CoachCard` ou `ProposalCard` (« Je propose » · « En attente »,
   puis « Appliqué »).
4. Puces de suggestion, `Composer`, `UndoToast` au-dessus du `Composer`.

## Progrès (`211`)
1. `ScreenHeader` « Progrès » · « Où tu en es, sur la durée. »
2. `SegmentedControl` Semaine · Mois · Année.
3. `PeriodCard` (« Mai 2026 », « 4h50 d'entraînement · 6 séances », barres par semaine,
   répartition par sport, « **2 semaines actives sur 4** : celles du 11 et du 18 mai. »).
4. `RaceList` « Tes semis » : chaque ligne ouvre le débrief de la course.
5. Sous le seuil : `EmptyState firstSessions` (« Ta progression arrive. ») puis « Déjà fait » (une
   ligne par séance avec son ressenti) et la légende « Ressenti que tu as donné en validant la
   séance. »

Selon le niveau : semaines actives (« Je débute »), km et sorties (« Je cours un peu »), charge et
prédictions en fourchette (« Je m'entraîne », pas encore maquetté).

## Profil (`213`) — modale ouverte par l'avatar
1. « Fermer » à droite ; avatar, prénom en `title`, objectif en `sub` (« Semi des Lions en 1h45 ·
   11 avril 2027 »).
2. `SettingsGroup` « Toi » : Niveau · Équipement (avec alerte si l'équipement déclaré ne
   correspond pas aux données) · Objectif.
3. `SettingsGroup` « Personnalisation » : Niveau choisi · « Analyser mes séances » (sur ton
   téléphone) · « Envoyer un résumé à l'IA » (« Accordé le [date] · le retirer ne supprime rien »).
4. Données › · Réglages › (« Apparence, modules »).

**Données** (« ‹ Profil ») : titre et phrase « Ce que l'app a de toi, et ce que tu peux en faire. » ;
carte sources (« Strava · 166 activités · Jamais envoyées à l'IA », « Ce qui manque : 30 activités
sans cardio · 29 renfos sans distance ») ; bascule « Regrouper les séances » avec l'exemple du
20 mai et la légende « Un regroupement se défait depuis la séance, avec « Séparer ». » ; bouton
contour « Exporter mes données » (JSON : activités, plan, réglages, consentements) ; lien rouge
« Supprimer mes données » (« Définitif, sur ce téléphone et partout ailleurs. On te demandera de
confirmer. »).

## Onboarding (`210`, `216`)
Quatre étapes, `StepHeader`, titre `title`, phrase d'explication, `OptionCard`, bouton plein
« Continuer » en bas (désactivé tant qu'il manque une réponse ou l'accord). Contenu : ADR-012,
amendement §5. L'étape 3 affiche, pour une course, « Ton semi » (temps visé, date) et la phrase de
périodisation (« Une phase de base jusqu'à mi-janvier, puis 12 semaines de bloc spécifique. Date
non officielle : je te préviens si elle change. »). L'étape 4 dit ce que chaque niveau lit et où
c'est calculé ; le niveau 2 exige `ConsentBlock`.

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
2. **Écart court** : entre la fin de A et le début de B, `GROUP_MAX_GAP_MIN = 15` minutes au plus.
3. **Même jour local** (timezone configurable, défaut `Europe/Paris`), et une séance ne dépasse
   pas `GROUP_MAX_DURATION_H = 4` heures de bout en bout.
4. **Pas de doublon** : la déduplication des imports (même activité venue de deux sources)
   passe avant le regroupement.
5. **Aucun override `split`** sur ces activités.

La règle est **chaînée** : si A→B ≤ 15 min et B→C ≤ 15 min, alors A, B et C forment une seule
séance, même si l'écart A→C dépasse 15 min.

Les rôles se déduisent ensuite : le bloc **principal** est l'activité la plus intense (allure
la plus rapide, ou FC moyenne la plus haute quand elle existe). Ce qui le précède est un
**échauffement**, ce qui le suit un **retour au calme**. Le titre de l'activité (« Échauffement »,
« Déchauffement ») ne sert que d'indice de départage, jamais de critère seul.

## Overrides disponibles

```ts
type GroupOverride =
  | { type: 'split'; activityId: string }        // cette activité ouvre une nouvelle séance
  | { type: 'merge'; activityIds: string[] }      // regroupement forcé (même famille obligatoire)
  | { type: 'role'; activityId: string; role: 'warmup' | 'main' | 'cooldown' };
```

- **`split`** : empêche le regroupement automatique de cette activité avec la précédente.
  Le chaînage avec les suivantes continue normalement.
- **`merge`** : regroupe les activités listées, sans tenir compte de l'écart ni du jour.
  Si les activités n'ont pas toutes la même famille de sport, l'override est ignoré
  (retourné dans `ignoredMergeOverrides`).
- **`role`** : attribue un rôle à une activité dans sa séance (uniquement via override ;
  les rôles automatiques ne sont pas calculés par `groupSessions`).

L'option `neverGroup` désactive tout regroupement automatique tout en appliquant les overrides
`merge` déjà posés par l'utilisateur.

## Identifiant de séance

`Session.id = 's_' + id-de-la-première-activité` (ordre chronologique). L'identifiant est
stable : il ne change pas quand des activités sont ajoutées au groupe lors d'un import ultérieur.

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
- **Regrouper les séances** : bascule dans Profil › Données, active par défaut (`213`). La
  désactiver revient à `neverGroup` : la règle s'arrête sans toucher aux overrides `merge` déjà
  posés.

Les overrides sont stockés à part, avec les ids d'activités : changer la règle (`ruleVersion`)
ne les efface jamais. PulseFit n'écrit rien vers Strava ni vers Apple Santé : le regroupement
n'existe que dans l'app.
