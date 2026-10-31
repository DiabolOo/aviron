# UX v2 — de l'ancienne app à la nouvelle (spec écran par écran + système visuel)

> À donner à l'agent au **Jalon 4** (avec `AGENTS.md` et `ROADMAP.md`).
> Navigation et direction visuelle **validées par Julien le 2026-10-31** (maquette « PulseFit — Refonte visuelle » : Accueil, Plan, Agent, Suivi en clair et en sombre + page « Système visuel »).
> Le contenu détaillé de chaque écran est une **proposition** à ajuster après essai sur téléphone. Les données restent des mocks : on change la structure, l'ergonomie et le look, pas le backend.
> Les captures de la maquette sont à placer dans `docs/design/` (clair-accueil.png, sombre-accueil.png, etc.) : en cas de doute, **la capture fait foi**.

## 0. Ce qu'on garde et ce qu'on change

**Comportement (inchangé)**
1. L'app **propose**, l'utilisateur **valide** (au lieu de saisir).
2. Une **barre de commande** (texte ou dictée) remplace les formulaires.
3. L'accueil répond à « que dois-je faire maintenant ? » avant de montrer des chiffres.
4. Chaque donnée n'apparaît qu'**une fois par écran** (voir §8).

**Look : nouvelle direction (thème « Aurore »)**. Détail au §12 ; en résumé :
- fin des libellés en police mono capitales espacées, du gros bouton lime et du lime comme couleur d'action ;
- police **Inter** partout, plus grosse (texte courant 16–17 px, jamais sous 13 px) ;
- cartes « widgets » très arrondies, légèrement teintées selon leur fonction, avec un grand chiffre et une petite animation ;
- **valider = maintenir le doigt** sur la carte (un trait fait le tour, puis « Séance validée ») ;
- peu de couleurs : 3 teintes de domaine, le dégradé violet→rose réservé à l'IA, une flamme orange pour la série ;
- thème **clair et sombre** sur les mêmes composants (jetons de couleur, §12.2) ;
- animations fluides inspirées de la course et du pouls (§12.5).

Réutiliser les composants existants (`Card`, `Segmented`, `ProgressRing`, `EmptyState`, `ErrorState`…) en les **restylant** avant d'en créer de nouveaux. `Label` (mono capitales) est remplacé par un `Caption` sans capitales.

## 1. Navigation : ancien → nouveau

| Ancien onglet | Nouveau | Ce qui devient quoi |
|---|---|---|
| Aujourd'hui | **Accueil** | Même rôle, réorganisé en widgets (§2). Libellé court « Accueil » pour la barre. |
| Sport | **Plan › Sport** + **Suivi › Sport** | Programme et calendrier → Plan ; historique et analyses → Suivi |
| Nutrition | **Plan › Nutrition** + **Suivi › Nutrition** + saisie depuis Accueil / Agent | Cibles et semaine de repas → Plan ; journal et macros → Suivi ; ajout d'un repas → bouton « + » du widget Nutrition ou barre de commande |
| Profil | **Pastille profil** (prénom du titre d'Accueil) + nouvel onglet **Stats** | Profil et réglages → écran Profil (§7) ; tendances → Stats (§7ter) |
| — | **Agent** (onglet central) | Barre de commande, propositions en attente, historique |

**Titres évocateurs + phrase de rôle** sous chaque titre de page :

| Onglet | Titre | Phrase de rôle |
|---|---|---|
| Accueil | Bonsoir, Jul › | À faire aujourd'hui |
| Plan | Ma semaine | Ce que tu vas faire |
| Agent | Ton agent | Demande, il propose, tu valides |
| Suivi | Mon journal | Ce que tu as fait, jour par jour |
| Stats | Ma progression | Où tu en es sur le mois et l'année |

Les étiquettes de la barre du bas restent courtes (Accueil, Plan, Agent, Suivi, Stats).

**Rôle de chaque onglet** : Accueil = **présent** (ce qui compte aujourd'hui) · Plan = **futur** (ce que je vais faire) · Suivi = **passé détaillé** (journal, calendrier, historique) · Stats = **tendances** (est-ce que je progresse ?) · Agent = **aide**. Les réglages sont dans le **Profil**, ouvert par la pastille de l'Accueil (§7).

Barre de navigation : `Accueil · Plan · ✦ Agent · Suivi · Stats`. Toujours 5 onglets, quels que soient les modules actifs (voir §7bis).
- 5 emplacements de **largeur égale et fixes** ; l'icône et son nom (12–13 px) sont toujours visibles ; l'onglet actif est en couleur pleine (texte principal) et posé sur un **pad arrondi** qui **glisse** d'un onglet à l'autre (≈ 700 ms, courbe `cubic-bezier(.16,1,.3,1)`).
- Barre flottante en verre (fond translucide + flou, liseré fin, ombre douce), 72 px de haut, marges de 16 px.
- Le bouton **Agent** (rond de 54 px, dégradé violet→rose) ne bouge jamais et émet une **lueur douce qui pulse** (≈ 3 s). Sur l'onglet Agent, il a un anneau clair autour.
- La barre de commande est aussi accessible depuis l'Accueil (via l'onglet Agent ou un raccourci), pas seulement depuis l'onglet Agent.

## 2. Accueil (ancien « Aujourd'hui »)

**Avant** : bonjour + date, puces « 3 jours » et météo, message de statut, grande jauge « 2250 kcal restantes », carte Énergie, carte « Séance du jour » avec bouton de validation. Problèmes : validation en bas et difficile à atteindre, jauge dominante qui ne dit rien à faire, objectif affiché ailleurs (2270) différent de « restantes » (2250), météo mockée.

**Après (de haut en bas)** :
```
Vendredi 30 octobre                          [🔥 4 jours]
Bonsoir, Jul
┌ Séance du jour ───────────────────────────┐
│ [icône] Legs                              │   ← carte HÉROS, teinte indigo, ondes qui pulsent
│  55 min │ 380 kcal │ 3 / 5                │
│  ✋ Maintiens pour valider      Reporter   │   ← maintenir = valider (§12.6)
└───────────────────────────────────────────┘
┌ Nutrition  [+] ┐ ┌ Forme ───────────┐
│ 850            │ │ 88               │      ← 2 widgets : grand chiffre + mini-animation
│ kcal restantes │ │ Optimale         │
│ ▂▃▁▅▃▆ (jours) │ │ ∿ pouls          │
└────────────────┘ └──────────────────┘
┌ ✦ 2 propositions du coach              ›┐   ← ouvre l'onglet Agent
│   Séance de demain, 1 repas              │
└───────────────────────────────────────────┘
```
**Règles**
- **Hero** : normalement la séance du jour. S'il n'y en a pas, le hero montre **la meilleure prochaine action** (repas manquant → « Enregistrer le déjeuner », proposition en attente…). Jamais de carte vide : message de confirmation.
- La **validation** se fait en maintenant le doigt ; elle peut aussi être **automatique** quand l'activité correspondante arrive (avec annulation).
- **Nutrition** : grand chiffre = kcal restantes, issues de `getDailyBalance(date)` (même source que Suivi). Le « + » ouvre l'ajout rapide : repas habituels de l'heure, « Comme hier », appareil photo, texte. Les macros ne sont **pas** affichées ici (elles sont dans Suivi).
- Mini-graphique Nutrition : 7 jours (la barre du jour en corail).
- **Forme** : indice 0–100 mock au J4 ; « Pourquoi ? » ouvre l'explication. Une ligne de pouls défile en continu.
- **Coach** : une seule ligne résumant les propositions (nombre + sujet) ; le détail est dans Agent.
- **Météo** : n'afficher que si elle change une recommandation ; la ville ne doit pas être codée en dur.
- Aucun bouton collé au bord de l'écran ; respecter les zones de sécurité et la barre flottante (marge basse ≥ 100 px).

## 3. Plan (reprend le « Programme » de l'ancien Sport)

**Avant** (onglet Sport) : gros bouton lime, carte « Adapter ma semaine » avec **Forme** (Frais / OK / Fatigué) + **Temps max** + « Régénérer », puis la liste des activités Strava.

**Après** :
```
Plan
┌ Ton objectif ─────────────────────────────┐
│ Ex. Semi en 1 h 45 dans 10 semaines,      │   ← une phrase suffit (texte libre)
│ 4 séances par semaine, pas le mercredi    │
│ [🎤]  [ ✦ Créer mon plan ]                │
└───────────────────────────────────────────┘
Ou pars d'un modèle : (Prépa course) (Gain de force) (Endurance) (Entretien / santé)
Basé sur tes 7 derniers jours : 35,3 km et 2 séances.
```
**Sélecteur de module** sous le titre : onglets à icône (coureur, pomme, cible) avec un **souligné coloré qui glisse** sous le module actif, sans fond (pour ne pas ressembler à la barre du bas) ; généré depuis les modules actifs (§7bis). Le contenu peut aussi se balayer horizontalement. Le dernier choix est mémorisé par onglet. Maquettes : `Plan · Sport`, `Plan · Nutrition`.

**Plan › Nutrition**
```
Plan   [ Sport | Nutrition | Objectifs ]
┌ Cibles du jour ──────────────────────────┐
│ 2 810 kcal · maintien                     │   ← calculé par le code, pas par l'IA
│ Protéines 150 g · Glucides 320 g · Lipides 85 g (barres)
└───────────────────────────────────────────┘
┌ Semaine de repas ────────────────────────┐
│ ( L ) M M J V S D                         │   ← jour sélectionné
│ Petit-déj / Déjeuner / Dîner  + kcal      │
└───────────────────────────────────────────┘
[ ✦ Planifier avec l'Agent ]                    ← ouvre l'Agent avec le contexte (pas de saisie ici)
```
Les repas viennent de la base d'habitudes de l'utilisateur ; l'IA propose, les kcal et macros sont recalculés par le code. La liste de courses est une vue de la semaine (hors maquette).

**Règles (révisées : une seule porte vers l'IA)**
- **Plus aucune zone de texte libre dans Plan** : on parle à l'IA uniquement dans l'onglet Agent. Plan affiche et ajuste le plan ; chaque écran a un bouton contextuel (« Modifier avec l'Agent », « Planifier avec l'Agent ») qui ouvre l'Agent avec le contexte déjà indiqué (ex. « Plan · semaine du 2 nov. »).
- **Plan › Sport avec plan** (titre « Ma semaine ») : carte Objectif (« Semi-marathon en 1 h 45 », J-70, progression) puis la semaine (jour, séance, durée/distance) puis « Modifier avec l'Agent ». Le détail de séance (blocs course / exercices muscu) est conservé.
- **Plan › Sport sans plan** : carte « Pas encore de plan » + bouton « Créer mon plan avec l'Agent » ; les 4 modèles (Prépa course, Gain de force, Endurance, Entretien / santé) restent comme raccourcis qui ouvrent l'Agent pré-rempli.
- Le formulaire Forme / Temps / Régénérer est **supprimé** : la forme est inférée (une ligne éditable) et tout le reste se dit dans la barre de commande (« claqué, 45 min max cette semaine »).
- Toute modification passe par une **ProposalCard** avec aperçu avant/après, jamais directement.

## 4. Agent (nouveau, onglet central)

```
Ton agent — « Demande, il propose, tu valides »
[ Que veux-tu faire ?          📷  🎤 ]        ← 1. DEMANDE : seul champ de saisie IA de l'app
À valider (2)                                   ← 2. propositions en attente
┌ Plan · demain ──────────────── [Voir] ┐
│ Remplacer Legs par un footing 40 min  │      ← « Voir » ouvre l'aperçu avant → après
│ Repas · dîner ──────────────── [Voir] │         + Pourquoi ? / Valider / Modifier / Refuser
│ Pâtes au thon · 740 kcal              │
└───────────────────────────────────────┘
Tu peux lui demander                            ← 3. EXEMPLES visibles sans défiler
 ● « Décale ma séance de demain »  ↗            (tap = pré-remplit la barre)
 ● « Prépare un semi en 1 h 45 »   ↗
 ● « Que manger ce soir ? »        ↗
 ● « Planifie mes repas »          ↗
Historique · 12 propositions ›                  ← repliable, avec « Annuler »
```
**Les trois zones** : Demande · À valider · Historique. Les exemples sont **groupés par domaine** (pastille de la couleur du module), **2 par module actif**, et s'adaptent à l'heure (le soir, la nutrition passe en premier) ; ils sont toujours visibles, plus de puces qui défilent hors écran. Si aucune proposition n'est en attente, « À valider » disparaît et les exemples remontent. Le détail d'une proposition (avant barré → après, question ciblée, niveau de confiance) s'ouvre dans la feuille « Voir ».
**Règles**
- **Au J4, l'agent est un `MockAgent`** : il renvoie des `Proposal` conformes au schéma Zod (§5). La vraie IA arrive aux jalons 6, 7 et 9. Ne pas appeler de service externe.
- 📷 ouvre directement l'appareil photo (analyse mockée). Dictée : champ texte au J4, dictée réelle ensuite.
- La barre de commande a un vrai espace intérieur (≥ 20 px à gauche) ; texte d'exemple court (jamais tronqué).
- Étiquettes de type (« Plan · demain », « Repas · dîner ») : **discrètes** — une teinte douce en clair, gris neutre en sombre.
- Les propositions ont **un seul lieu de traitement : l'Agent**. L'Accueil n'affiche qu'un rappel (« 2 propositions du coach »), Plan n'en montre un bandeau que si elles concernent la page, avec lien vers l'Agent.

## 5. Contrat `Proposal` (utilisé par les écrans ci-dessus)
Voir `ROADMAP.md` (J3). Pour le J4, types à simuler :
1. `adjust_plan` — déplacer ou alléger une séance (avant / après visibles).
2. `log_meal` — repas déduit d'une phrase ou d'une photo (aliments, kcal, macros, **confiance**).
3. `adjust_nutrition_targets` — nouvelle cible kcal / macros pour un jour donné (avec « Pourquoi ? »).

Chaque proposition affiche : titre court, aperçu du changement, `rationale` (« Pourquoi ? » en un tap), boutons **Valider / Modifier / Refuser**, et **Annuler** pendant quelques secondes après validation. Statuts : `pending | accepted | edited | rejected | undone`.

## 6. Suivi (regroupe l'ancien Sport et l'ancien Nutrition)

Sélecteur en haut, **généré depuis les modules actifs** : `Nutrition | Sport | Objectifs` (extensible : Sommeil…). Chaque module s'enregistre via le manifeste `LifeModule` (§7bis). Sous Suivi › Objectifs : progression de chaque objectif (poids, allure, régularité). Contrôle segmenté à fond gris, pastille active blanche (en sombre : surface plus claire que le fond du contrôle).

### Suivi › Nutrition
```
Suivi          [ Nutrition | Sport ]
┌ Octobre 2026                  ‹  ›  ┐
│  L   M   M   J   V   S   D          │    ← calendrier de semaine (§6.1)
│ 26  27  28  29 (30)  31   1         │
│  •   •   •   •                      │    ← point corail = jours avec des repas
└─────────────────────────────────────┘
┌ 1 960 / 2 810 kcal ─────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬     │
│ Protéines 135/149  Glucides 224/385  Lipides 52/75 │   ← 3 colonnes + mini-barres
└─────────────────────────────────────┘
┌ Matin      Skyr et granola       420 ┐   ← journal : UNE carte, lignes séparées par un trait fin
│ Midi       Poulet, riz, brocolis 640 │
│ Collation  Banane, amandes       260 │
└──────────────────────────────────────┘
```
**Avant** : en-tête + trois puces P/G/L, bande de jours, gros bouton lime « Scanner », « Ajout manuel », carte « Apports du jour » qui répète kcal et macros.
**Règles**
- **Une seule** représentation des apports (carte de synthèse) ; les puces redondantes disparaissent.
- Saisie : repas habituels suggérés selon l'heure (1 tap), « Comme hier », appareil photo, langage naturel via la barre de commande. Plus de gros bouton lime.
- Journal **trié par heure**, groupé matin / midi / collation / soir ; **pas d'icône crayon permanente** : on touche une ligne pour modifier, balayage pour supprimer. Nom du repas court (1 ligne).
- Navigation entre les jours conservée ; « Mes recettes » reste un raccourci ; création de recette perso conservée.

#### 6.1 Calendrier de semaine (remplace la bande de jours)
- Carte avec le mois en titre (19 px, semi-gras) et deux boutons ronds ‹ › pour changer de semaine.
- Sept colonnes : initiale du jour (13 px, grise), numéro dans un **rond de 44 px**, **point de 6 px** dessous.
- Jour sélectionné : rond plein foncé (clair) / blanc (sombre), numéro inversé. Jours futurs : numéro grisé. Jours avec données : point corail.
- Zone tactile ≥ 44 px ; balayage horizontal pour changer de semaine ; toucher le mois ouvre un sélecteur de mois (hors J4).

### Suivi › Sport (ancien historique d'activités)
**Avant** : « Activités Strava · 35,3 km course », liste.
**Après** : titre **« Activités »** (la source n'est plus forcément Strava : `ROADMAP.md`, jalon 8) ; liste et écran de détail conservés (carte, splits, FC) ; résumé hebdomadaire en tête (volume, allure moyenne, tendance 4 semaines, calculé dans `src/core/`) ; emplacement **« Analyse IA »** en haut du détail (3 constats + 1 conseil, placeholder au J4).

## 7. Profil (ancien « Moi », ouvert par la pastille de l'Accueil)
Pas de pastille : le **prénom dans le titre d'Accueil** (« Bonsoir, **Jul** ›) est le point d'entrée. Il se distingue du reste du titre par un dégradé violet→rose, un **relief 3D** (graisse 800, liseré clair, ombre portée) et un chevron (sans soulignement), pour montrer qu'il est tappable. Il ouvre l'écran **Profil** (retour « ‹ Accueil »), qui n'a pas d'onglet actif dans la barre ; l'Agent peut aussi l'ouvrir (« ouvre mes réglages »). Contenu : carte identité (prénom, objectif) puis liste Modules · Objectifs · Connexions · Apparence · Compte et données.
Même contenu, regroupé en sections : **Objectifs** (poids actuel / cible, rythme, calories) · **Connexions** (sources de données ; bascule mock conservée) · **Apparence** (thème : Clair / Sombre / Système) · **Compte & données** (export, suppression, prévus au J5). Prénom et objectif sportif modifiables. Section **Modules** (maquette `Profil · Modules`) : liste de bascules (Sport, Nutrition, Objectifs, Forme & sommeil, Agenda « bientôt »). Le reste : mêmes cartes et même typographie (§12).

## 7ter. Stats (nouvel onglet)
Une **seule page qui défile**, sans sélecteur de module (pas de barre supplémentaire). En tête : période `Semaine | Mois | Année` (puces simples). Puis **une carte par module actif** : Sport (total, variation vs période précédente, histogramme par semaine), Nutrition (moyenne kcal/jour, courbe vs cible), Forme & sommeil (tendance). Une carte **Analyse de l'Agent** (constats et un conseil) ; les insights croisés (sommeil → séance) n'apparaissent que si les deux modules sont actifs. Tous les chiffres sont calculés dans `src/core/` ; l'IA ne fait que commenter. Maquette : `Stats`.

## 7bis. Modèle modulaire

L'utilisateur active les modules qui l'intéressent (à l'onboarding puis dans **Moi › Modules**). Sport seul, Nutrition seule ou les deux (plus Objectifs, Forme & sommeil) : l'app s'adapte.

- **Sélecteur** (Plan, Suivi) : masqué s'il n'y a qu'un module ; segmenté pour 2 à 3 ; pastilles défilantes au-delà de 4 ; dernier choix mémorisé par onglet ; vue « Tout » possible plus tard.
- **Accueil** : widgets issus des modules actifs. Maquette `Accueil · nutrition seule` : carte « Ce soir · Dîner » (proposition calculée sur les kcal restantes et les habitudes) à la place de la carte séance, widget Nutrition seul, ligne coach.
- **Insights croisés** (ex. sommeil → séance) seulement si les deux modules sont actifs.
- **Manifeste `LifeModule`** : déclare ses widgets d'accueil, sa section Plan, sa section Suivi, ses types de `Proposal`, ses outils d'agent et ses réglages. Aucun écran ne référence un module en dur.
- Désactiver un module masque ses écrans sans supprimer ses données.

## 8. Corrections de données (à faire dans la même PR que l'accueil)
1. **Une source unique** : `getDailyBalance(date)` fournit kcal objectif, mangées, brûlées, restantes et macros. Aujourd'hui l'accueil affiche 2250 restantes alors que Nutrition affiche un objectif de 2270 avec 0 mangé : incohérence à corriger.
2. **Invariant testé** : P×4 + G×4 + L×9 = objectif ±1 %. Les valeurs vues (140 P / 255 G / 63 L ≈ 2147 kcal pour 2270) ne le respectent pas.
3. Un repas ne doit pas apparaître deux fois (ex. « Pâtes au thon » en double) : id unique ; un repas ajouté doit être compté **partout** (Accueil, Suivi).
4. Pas d'information affichée deux fois sur un même écran.
5. Libellé « Activités Strava » → « Activités » ; bouton d'outils de développement d'Expo masqué ou hors des zones tactiles.

## 9. Budget de taps (à vérifier sur téléphone en fin de jalon)
| Parcours | Budget |
|---|---|
| Valider la séance du jour | 1 geste (maintenir 1,3 s) |
| Enregistrer un repas habituel | ≤ 2 |
| Enregistrer un repas par photo | ≤ 3 |
| Planifier ou modifier sa semaine | 1 phrase |
| Accepter une proposition | 1 |

## 10. Ordre de réalisation (une PR par étape)
0. **Fondations visuelles** : jetons de thème clair/sombre (§12.2), police Inter, composants de base restylés (`Card`, `Caption`, `Segmented`, barre de navigation à pad glissant), `HoldToConfirmCard` (§12.6), hook `useReducedMotion`. Une page « galerie » montre les composants dans les deux thèmes.
1. Navigation à 5 onglets et squelettes d'écrans, sans perdre les écrans existants (déplacés, pas réécrits).
2. `getDailyBalance` + test d'invariant + corrections de données (§8).
3. `ProposalCard` + store de propositions + `MockAgent`.
4. Accueil (§2).
5. Agent (§4) et barre de commande.
6. Plan (§3).
7. Suivi (§6) : fusion Sport + Nutrition, calendrier (§6.1), suppression des doublons.
8. Moi (§7), puis passage sur téléphone en clair **et** en sombre, mesure du budget de taps.

## 11. Hors périmètre du J4
Vraie IA, backend, comptes, Strava / Apple Health réels, notifications, paywall. Ne pas supprimer de fonctionnalité existante sans la reloger dans le tableau du §1.

---

## 12. Système visuel « Aurore » (clair + sombre)

### 12.1 Principes
1. **Épuré** : une information principale par carte ; le détail s'ouvre au toucher.
2. **Widgets** : chaque fonction a sa carte et sa place ; pas de mur d'informations.
3. **Peu de couleurs** : une teinte par domaine, le dégradé IA réservé à l'IA, une flamme pour la série. Pas de vert.
4. **Alignement à gauche** partout ; seuls les chiffres au centre d'un anneau éventuel sont centrés.
5. **Lisible d'abord** : texte ≥ 13 px (courant 16–17), contraste ≥ 4,5:1 en clair **et** en sombre, y compris les textes d'exemple (placeholders).
6. **Mouvement utile** : l'animation guide l'œil (arrivée, remplissage, validation) ; elle ne gêne jamais la lecture.

### 12.2 Jetons de couleur (`src/ui/theme/tokens.ts`)
| Jeton | Clair | Sombre |
|---|---|---|
| `bg` | `#F5F6F8` + halo (§12.3) | `#090B0F` + lueur `#1B2030` en haut |
| `card` | blanc ≈ 94 %, liseré blanc, ombre douce | `#262B3A`, liseré `#3D4357`, reflet haut `rgba(255,255,255,.09)`, ombre noire |
| `ink` (texte) | `#0E1116` | `#FFFFFF` |
| `mute` (secondaire) | `#4B5563` | `#C8CDDA` (plus discret : `#AAB0C2`) |
| `track` (fond de barre) | `#DDE1E8` | `#434A60` |
| `chip` / bouton secondaire | `#E9ECF1` | `#363D52` |
| `primaryButton` | fond `#0E1116`, texte blanc | fond blanc, texte `#0E1116` |
| `sport` (Séance, Plan) | `#4F46E5` (teinte `#ECEBFF`) | `#B5B0FF` (teinte `#2B2E4D`) |
| `nutri` (Nutrition) | `#FF7A59`, dégradé `#FFB08F → #FF6A45` | `#FF8A6B`, même dégradé |
| `forme` (Forme) | `#14B8A6`, dégradé `#5EE0CF → #0EA394` | `#2DD4BF` |
| `ai` (Agent, coach) | dégradé 135° `#6D5AE6 → #E5588A` | idem |
| `flame` (série) | dégradé `#FF4D2E → #FFA23A` | idem |
| `done` (validation) | fond `#4F46E5`, texte blanc | fond `#5B4FE0`, texte blanc |

Les trois macros (P, G, L) utilisent **la même teinte corail** (barres de longueurs différentes) pour limiter le nombre de couleurs. Le thème suit le système par défaut, modifiable dans Moi › Apparence.

### 12.3 Fond et dégradé
- **Clair** : deux halos radiaux doux — vert très pâle `#E3F6BD` en haut à gauche, pêche `#FFDCCB` en haut à droite ; la teinte change selon l'écran (Plan : lavande `#DAD8FF` à droite ; Agent : lilas `#E4DAFF` + rose `#FFD9E6` ; Suivi : jaune pâle `#FDF1C4` + pêche).
- **Sombre** : fond quasi noir **uni** avec une seule lueur bleutée discrète en haut. Pas de dégradés colorés (le contraste prime).
- Le fond **dérive très lentement** en clair (≈ 16 s, léger déplacement/zoom) ; fixe en sombre ou si « réduire les animations ».

### 12.4 Typographie, formes, espacements
- **Police : Inter** (via `expo-font`, poids 400/500/600/700). Chiffres tabulaires (`fontVariant: ['tabular-nums']`) pour tous les nombres.
- Titre d'écran 34 px / 700 / interlettrage −0,025 em. Titre de carte 17 px / 600. Texte courant 16–17 px. Texte secondaire 15–16 px. Grands chiffres 40 px / 700. Libellé de barre de navigation 12–13 px. **Minimum 13 px.**
- Cartes : rayon **28**, padding 18–22, une ombre douce (pas de double contour). Contrôles : pilules (rayon ½ hauteur), hauteur ≥ 44 px (principal 52).
- Marges d'écran : 20 px ; espace entre cartes : 14 px ; marge basse ≥ 100 px (barre flottante).
- Pas de capitales espacées ni de police mono.
- **Teinte des cartes** : un halo radial très léger dans le coin haut-droit de chaque carte (indigo pour la séance, corail pour Nutrition, turquoise pour Forme, rose pour le coach) ; **pas de halo en sombre**.
- Un seul **bouton principal** plein par écran (noir en clair, blanc en sombre) ; le reste en boutons secondaires ou liens.

### 12.5 Mouvement (`src/ui/motion/`)
| Élément | Animation |
|---|---|
| Arrivée des cartes | glissement depuis la droite (≈ 40 px) + léger biais (−3°), 800 ms, `cubic-bezier(.16,1,.3,1)`, décalage de 70 ms entre cartes (« foulée ») |
| Grands chiffres (850, 88) | comptage de 0 à la valeur, ≈ 1,6 s, ralentissement en fin |
| Barres et mini-histogramme | remplissage de gauche à droite / de bas en haut, décalage de 60 ms entre barres |
| Pouls (widget Forme) | tracé qui défile en boucle, 2,1 s, linéaire |
| Ondes de la carte séance | 3 cercles concentriques qui s'élargissent et s'effacent, **4,4 s** par onde (décalage 1,5 s), très légers, coupés par la carte |
| Bouton Agent | lueur qui pulse, ≈ 3 s |
| Pad de navigation | glisse vers l'onglet actif, ≈ 700 ms |
| Appui sur un bouton | léger rétrécissement (95 %), retour en 180 ms |
| Fond | dérive lente (clair uniquement) |

Règles : **dans l'app, les animations d'arrivée jouent une fois à l'ouverture de l'écran** (la maquette les boucle seulement pour la démo) ; les boucles continues (pouls, ondes, lueur) ne tournent que lorsque l'écran est visible ; **tout est désactivé ou figé** si « réduire les animations » est actif (`AccessibilityInfo.isReduceMotionEnabled`). Implémentation : `react-native-reanimated` (valeurs partagées + `withTiming` / `withSpring`) et `react-native-svg` pour anneaux, pouls et tracés ; pas de bibliothèque d'animation supplémentaire sans ADR.

### 12.6 Geste « maintenir pour valider » (`HoldToConfirmCard`)
Composant réutilisable : séance, validation d'une proposition importante, etc.
- **Maintien** : un trait de 4 px dans la couleur du domaine (indigo pour la séance) fait **le tour du rectangle arrondi** en **1,3 s** (linéaire). La carte se tasse très légèrement (98,5 %) pendant l'appui. Retour haptique léger au début.
- **Relâché avant la fin** : le trait **recule** (≈ 350 ms), rien n'est validé.
- **À la fin du tour** : la carte se remplit de la couleur `done`, une coche se dessine (≈ 400 ms) dans un rond, texte « Séance validée » + « Série : 5 jours », ressort élastique (légèrement plus grand puis normal), **haptique de succès**. L'état « validée » **reste affiché** (la maquette ne peut pas le conserver).
- **Annulation** : « Annuler » visible ≈ 5 s après la validation (statut `undone`).
- **Accessibilité** : `accessibilityRole="button"`, libellé « Valider la séance », et une **action d'accessibilité** (`accessibilityActions`) qui valide directement, sans maintien (lecteurs d'écran, commandes d'accès).
- Sous les chiffres, une ligne « ✋ Maintiens pour valider » (15–16 px) explique le geste ; « Reporter » est un lien discret à droite.
- Implémentation : `react-native-gesture-handler` (`LongPress` / `Pan`), progression pilotée par une valeur partagée ; tracé du périmètre via `react-native-svg` (`rect` avec `strokeDasharray` / `strokeDashoffset`, longueur normalisée) ; haptiques via `expo-haptics`. Logique de progression (clamp, seuil, annulation) extraite en fonctions pures testées dans `src/core/`.

### 12.7 Accessibilité et robustesse
- Contrastes vérifiés dans les deux thèmes, y compris texte d'exemple, boutons secondaires et barres.
- Zones tactiles ≥ 44 × 44 px ; libellés d'accessibilité sur tous les boutons-icônes (+, caméra, micro, flèches du calendrier).
- Respecter la taille de texte système jusqu'à 130 % sans troncature des chiffres clés (les libellés peuvent passer sur 2 lignes, pas les chiffres).
- La couleur ne porte jamais seule le sens (barres : texte à côté ; statuts : texte + couleur).

---

## 13. Prompt de départ pour Claude Code (jalon 4, étape 0)

> Lis `AGENTS.md`, `ROADMAP.md` (jalons 3–4) et `docs/UX-V2.md`. Commence par l'**étape 0** du §10 : crée les jetons de thème clair/sombre (§12.2), charge la police Inter, restyle `Card`, `Segmented` et la barre de navigation (pad glissant, bouton Agent, libellés), crée `HoldToConfirmCard` (§12.6) et `useReducedMotion`, et ajoute une page de galerie qui montre ces composants dans les deux thèmes. Ne touche ni aux données ni aux écrans existants. Écris des tests pour la logique pure (progression du maintien, comptage). Passe d'abord en mode plan : propose la liste des fichiers à créer ou modifier, puis attends mon feu vert avant de coder. Ouvre une PR par étape.
