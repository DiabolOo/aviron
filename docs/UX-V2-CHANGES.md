# UX v2 — ce qui change par rapport au premier thème Aurore

> ⚠️ **Obsolète — archive du Jalon 4.** Remplacé par la refonte v3.1 : `docs/SPEC-v3.md`,
> maquettes `docs/maquettes/v3.4/`, ADR-012.

Ce document ne liste que les **différences** entre le premier Aurore (5 onglets `Accueil · Plan · Agent · Suivi · Moi`, Plan = sport seul, Suivi = `Nutrition | Sport`) et la version actuelle de la maquette. Les tokens, la typographie, la carte « maintenir pour valider » et le mode sombre ne changent pas : voir `UX-V2.md` §12.

Maquette : canvas « PulseFit — Refonte visuelle » (un jeu d'écrans clair, un jeu sombre).

---

## 1. Navigation globale

| Avant | Maintenant |
|---|---|
| `Accueil · Plan · ✦ Agent · Suivi · Moi` | `Accueil · Plan · ✦ Agent · Suivi · **Stats**` |
| Profil dans l'onglet « Moi » | Profil ouvert par le **prénom cliquable** de l'Accueil |

- La barre reste à **5 onglets fixes**, quels que soient les modules actifs. Le pad arrondi glisse sous l'onglet actif.
- Sur l'écran Profil (et Modules), **aucun onglet n'est actif** ; retour par « ‹ Accueil » / « ‹ Profil ».
- L'Agent peut aussi ouvrir les réglages (« ouvre mes réglages »).

Rôle de chaque onglet : Accueil = présent · Plan = futur · Suivi = passé détaillé · Stats = tendances · Agent = aide.

## 2. Prénom cliquable (entrée vers le Profil)

Titre de l'Accueil : « Bonsoir, **Jul** › ».

- Prénom en **dégradé violet→rose** (même famille que le bouton Agent), graisse 800.
- **Relief 3D** : liseré clair sur les bords, ombre portée sous le mot ; en sombre, légère lueur.
- Petit **chevron `›`** à droite pour signaler que c'est tappable. Pas de soulignement, pas de pastille : l'en-tête reste léger.
- Implémentation : `background-clip: text` avec `-webkit-text-fill-color: transparent`, `drop-shadow` + `-webkit-text-stroke` fin. Zone tactile ≥ 44 px de haut (padding invisible). Le dégradé doit être déclaré **avant** `background-clip`.
- À valider sur appareil réel (rendu du relief, découvrabilité du geste). Option : animer le chevron une fois à la première ouverture.

## 3. Modules : catégories Sport / Nutrition / Objectifs

Idée : l'app est **modulaire**. Chaque utilisateur active ce qui l'intéresse (Sport seul, Nutrition seule, ou plusieurs).

### 3.1 Sélecteur de module (Plan et Suivi)
- **Onglets à icône** (coureur, pomme, cible) : `Sport | Nutrition | Objectifs`.
- **Souligné coloré qui glisse** sous le module actif (indigo Sport, corail Nutrition, violet Objectifs), sans fond, pour ne pas ressembler à la barre du bas (l'ancien contrôle segmenté prêtait à confusion).
- Généré depuis les modules actifs : masqué s'il n'y en a qu'un ; segmenté pour 2–3 ; puces défilantes au-delà de 4.
- Dernier choix **mémorisé par onglet**.
- **Navigation glissée** (spécifiée, non démontrable dans la maquette statique) : le contenu se balaie horizontalement au doigt, le souligné suit le geste (interpolation continue), la page voisine apparaît pendant le glissement, puis le tout se cale avec un ressort léger. Toucher un onglet déclenche la même transition.
- **Objectifs** est affiché comme onglet mais **à venir** : l'écran n'est pas dessiné (voir §8).

### 3.2 Plan › Nutrition (nouvel écran)
- Carte **Cibles du jour** : kcal et macros (barres), calculées par le code (« calculées par l'app »).
- Carte **Semaine de repas** : jour sélectionné (L M M J V S D) et trois repas avec kcal.
- Bouton **Planifier ma semaine** (+ dictée) : génère une `Proposal` (repas, courses) ; l'IA propose, les chiffres sont recalculés par le code.
- Plan › Sport est l'ancien écran Plan (objectif libre + modèles), simplement placé sous le sélecteur.

### 3.3 Suivi
- Le sélecteur devient `Nutrition | Sport | Objectifs` (même composant, ordre propre à Suivi). Contenu des vues Nutrition et Sport inchangé ; **Suivi › Objectifs** : progression des objectifs (à venir).

### 3.4 Accueil « nutrition seule »
Si le module Sport est désactivé :
- La carte séance (maintenir pour valider) est remplacée par **« Ce soir · Dîner »** : proposition de repas calculée sur les kcal restantes et les habitudes, boutons « Ajouter à mon journal » et « Autre idée ».
- Le widget Nutrition reste ; le widget Forme n'apparaît que si le module concerné est actif.
- Les insights croisés (sommeil → séance) n'existent que si les deux modules sont actifs.

### 3.5 Manifeste `LifeModule`
Chaque module déclare : widgets d'accueil, section Plan, section Suivi, section Stats, types de `Proposal`, outils d'agent, réglages. Aucun écran ne référence un module en dur. Désactiver un module masque ses écrans sans supprimer ses données.

## 4. Nouvel onglet Stats

- **Une seule page qui défile**, sans sélecteur de module (pas de barre supplémentaire).
- Période en tête : `Semaine | Mois | Année` (puces simples). Seule la vue « Mois » est maquettée.
- **Une carte par module actif** :
  - Sport : total (km, séances), variation vs période précédente, histogramme par semaine (dernière barre en dégradé indigo).
  - Nutrition : moyenne kcal/jour, courbe vs cible en pointillés.
  - Forme & sommeil : tendance (à dessiner).
- Carte **Analyse de l'Agent** (constats + un conseil) ; tous les chiffres sont calculés dans `src/core/`, l'IA ne fait que commenter.
- Distinction avec Suivi : Suivi = saisie, calendrier, journal, détail ; Stats = tendances et progression.

## 5. Écran Profil et Modules (ex-« Moi »)

- **Profil** : carte identité (initiale, prénom, objectif) puis liste `Modules · Objectifs · Connexions · Apparence · Compte et données` (chevrons).
- **Profil › Modules** : une bascule par module (Sport, Nutrition, Objectifs, Forme & sommeil) ; Agenda marqué « Bientôt ». Note : avec un seul module actif, les sélecteurs disparaissent et l'Accueil ne montre que lui.
- Activation des modules aussi proposée à l'onboarding.

## 6. Animations et fluidité

Ajouts ou changements par rapport au premier Aurore :

| Élément | Comportement |
|---|---|
| Souligné du sélecteur de module | glisse d'un module à l'autre (même courbe que le pad de la barre : `cubic-bezier(.3,1.3,.5,1)`, ~600 ms) |
| Contenu Plan / Suivi | balayage horizontal suivi du doigt, calage avec ressort léger |
| Pad de la barre du bas | glisse sous l'onglet actif (déjà présent, appliqué aux 5 nouveaux emplacements dont Stats) |
| Histogramme Stats | colonnes qui montent en cascade (décalage ~70 ms) à l'ouverture |
| Courbe Stats / barres de macros | tracé et remplissage progressifs, une fois |
| Compteurs, anneaux, barres (Accueil) | inchangés : comptent / se remplissent une fois à l'ouverture |
| Boutons | léger enfoncement (scale .95) au toucher |
| Chevron du prénom | option : petit mouvement une seule fois à la première ouverture |

Règles communes : durées 600–900 ms pour les entrées, une seule fois à l'ouverture sauf les lueurs d'ambiance, **`prefers-reduced-motion`** respecté (animations coupées, états finaux affichés).

## 7. Clarification des rôles (une seule porte vers l'IA)

Problème identifié : deux endroits pour parler à l'IA (zone de texte du Plan + barre de l'Agent), des noms d'onglets qui se recouvrent (Plan / Suivi / Stats), aucune phrase expliquant le rôle d'une page, un Plan qui ressemblait à un formulaire, des exemples de l'Agent qui défilaient hors écran.

- **Une seule saisie IA : l'onglet Agent.** Plus de zone de texte libre dans Plan. Boutons contextuels « Modifier avec l'Agent » / « Planifier avec l'Agent » qui ouvrent l'Agent avec le contexte.
- **Titres évocateurs + phrase de rôle** sous chaque titre : Ma semaine (Ce que tu vas faire) · Ton agent (Demande, il propose, tu valides) · Mon journal (Ce que tu as fait, jour par jour) · Ma progression (Où tu en es…) · Accueil (À faire aujourd'hui). Étiquettes de barre inchangées.
- **Plan › Sport** montre désormais le plan (objectif + semaine) ; un écran **« sans plan »** propose de le créer avec l'Agent (+ modèles).
- **Agent en trois zones** : Demande · À valider (compteur) · Historique, plus **exemples visibles groupés par domaine** (2 par module actif, adaptés à l'heure).
- **Propositions** : traitées uniquement dans l'Agent ; rappel sur l'Accueil.
- À faire : test des cinq secondes (montrer un écran à quelqu'un qui ne connaît pas l'app : « ici, tu fais quoi ? »).

## 8. Nettoyage de la maquette

- Suppression du doublon de barres : le sélecteur de module ne ressemble plus à la barre de navigation.
- Un seul jeu d'écrans par thème (clair, sombre) : Accueil, Accueil nutrition seule, Plan Sport (avec et sans plan), Plan Nutrition, Agent, Suivi, Stats, Profil, Profil › Modules.
- Titre de page « Moi » supprimé au profit de « Profil ».

## 9. Reste à faire côté design

- Écrans **Objectifs** (Suivi et Plan), à concevoir quand le module sera lancé.
- Stats : vues Semaine et Année, carte Forme & sommeil.
- Prototype interactif des transitions (glissement, spring) : seul un test sur appareil valide la sensation.
- Mise à jour de `UX-V2.md` (§1, §3, §6, §7, nouveaux §7bis et §7ter) : **déjà faite** ; ce fichier en est le résumé des écarts.
