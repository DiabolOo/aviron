# 🗺️ PulseFit — Feuille de route (agent-first & modulaire)

> **Objectif final** : un **Life OS** (sport, nutrition, sommeil, agenda, objectifs, habitudes) piloté par un coach.
> **Principe** : l'utilisateur exprime une *intention* (texte ou voix), le coach prépare, l'utilisateur **valide en 1 tap**.
> **Direction v3.1 « Phrase d'abord, chiffre ensuite »** : chaque écran commence par ce que les données veulent dire. Maquettes de référence : `docs/maquettes/v3.4/` (la capture fait foi), spécification : `docs/SPEC-v3.md`.
> **Bêta (en cours)** : un **coach de course à pied** — séance du jour validée en maintenant la carte, semaine prévue et faite, détail et débrief des séances, propositions du coach, progrès. Le **niveau déclaré** (« Je débute · Je cours un peu · Je m'entraîne ») règle les mots et la densité de chiffres ; le coach IA est optionnel (niveau 2, accord explicite).
> **MVP (v1.0)** : « Coach endurance IA » = plan par intention + brief quotidien ; nutrition et scan d'assiette viennent après la bêta.
> Le reste du Life OS se branche ensuite **sans refonte**, via des modules.

## Comment utiliser ce fichier
- Cocher `[x]` chaque tâche terminée ; passer le jalon à ✅ quand tout est coché et la **Definition of Done (DoD)** validée.
- Un jalon = un ensemble livrable et testable sur téléphone. On n'ouvre pas le suivant tant que le précédent n'est pas utilisable.
  **Exceptions** : J11 (monétisation) démarre dès que J7 + J8 sont livrés, en parallèle de J9–J10 ; les jalons de la Phase 2 peuvent se paralléliser une fois J12 livré.
- Chaque tâche est dimensionnée pour **une PR**. Ajouter une ligne au **Journal** à chaque étape importante.
- Statuts : ✅ terminé · 🔧 en cours · ⏳ à venir · ⚠️ gate à lever avant de continuer

## Règles pour l'agent de dev (Devin / Windsurf)
1. Lire ce fichier et `docs/adr/` avant toute tâche. Une tâche = une branche = une PR de petite taille.
2. Avant chaque commit : `npm run typecheck && npm run lint && npm test` doivent passer.
3. **Logique déterministe dans `src/core/`** : TypeScript pur, sans React ni réseau, 100 % testée (calculs nutritionnels, charge d'entraînement, validation de plans).
4. **Aucune clé secrète dans l'app** : seules les variables `EXPO_PUBLIC_…` publiques. Tout appel LLM passe par la passerelle serveur.
5. **Toute sortie d'IA est validée par un schéma Zod** avant d'être utilisée. Si invalide : 1 retry, puis repli sans planter.
6. **L'IA ne modifie jamais les données directement** : elle crée une `Proposal` que l'utilisateur valide (sauf actions à faible risque marquées `autoApply` avec bouton Annuler).
7. L'UI n'importe jamais les mocks : elle passe par les **repositories** (`src/data/`).
8. Ne pas toucher aux jalons non démarrés. Toute décision d'architecture → un fichier `docs/adr/NNN-titre.md`.
9. Ne jamais envoyer à un LLM plus de données que nécessaire (résumés agrégés plutôt que données brutes).

## Principes produit « anti-cliquodrome »
1. **Confirmer plutôt que saisir** : l'app propose, l'utilisateur valide.
2. **Inférer avant de demander** : forme, temps disponible, repas habituels sont déduits des données ; on ne pose pas la question.
3. **Une seule porte vers l'IA** : la saisie de l'onglet Coach (« Demande à ton coach… », texte ou dictée) est le **seul** champ de saisie libre ; ailleurs, « Modifier » ou « J'ai couru sans montre » ouvrent le Coach avec le contexte.
4. **Budget de taps** : valider une séance = 1 maintien (+ 1 tap de ressenti) · valider une proposition = 1 tap · planifier une semaine = 1 phrase.
5. **Chaque écran répond à « que dois-je faire maintenant ? »** avant de montrer des chiffres, et **annonce son rôle en une phrase** sous son titre (Semaine : « Prévu et fait, jour par jour. » · Coach : « Tu demandes, il prépare, tu valides. » · Progrès : « Où tu en es, sur la durée. »).
6. **Une donnée = un endroit** : pas d'information affichée deux fois sur le même écran.
7. **Tout score ou conseil est explicable** (« Pourquoi ? » en un tap) ; pas de nombre magique.
8. **Notifications actionnables** (valider, reporter) plutôt que « ouvre l'app ».

## Architecture cible (modulaire)

```
src/
  core/        # domaine pur, testé : nutrition, charge d'entraînement, validation de plans, dates
  modules/     # un dossier par module de vie (sport, nutrition, sommeil, agenda, objectifs…)
    sport/  nutrition/  profile/  …
  agent/       # passerelle LLM (client), routeur de modèles, prompts versionnés, outils, évals
  data/        # repositories (interfaces) + adaptateurs : mock · local · Supabase ; sync offline-first
  design/      # tokens v3.1 (theme.ts), useTheme, makeStyles, polices — sans NativeWind (ADR-011)
  ui/          # composants partagés (CoachCard, SessionCard, ProposalCard, CommandBar…)
app/           # routes Expo Router (fines : elles assemblent les modules)
supabase/      # migrations, edge functions (agent-gateway, analyse d'assiette, webhooks)
evals/         # jeux de cas et scoring des sorties d'IA
docs/adr/      # décisions d'architecture
```

**Un module = un manifeste** : ajouter un domaine de vie ne touche ni la navigation ni le cœur.

```ts
export interface LifeModule {
  id: string;                      // 'sport' | 'nutrition' | 'sleep' | 'calendar' | 'goals' …
  entities: ZodTypeAny[];          // schémas des données du module
  todayWidgets: TodayWidget[];     // cartes proposées dans « Aujourd'hui »
  week?: Dashboard[];              // sections de « Semaine » (prévu et fait, jour par jour)
  progress?: Dashboard[];          // cartes de « Progrès » (tendances, courses)
  settings?: ModuleSettings;       // réglages dans Profil › Modules
  agentTools: AgentTool[];         // outils que l'agent peut appeler (lecture libre, écriture via Proposal)
  analyzers: Analyzer[];           // jobs quotidiens / hebdo qui produisent des Insights
}
```

**Objets transverses** : `Proposal` (action proposée : `pending | accepted | edited | rejected | undone`, avec `rationale` et `confidence`), `Insight` (constat/conseil), `DailyBrief`, `AgentRun` (modèle, tokens, coût, latence), `Consent`.

**Navigation cible (ADR-012, remplace l'ADR-002)** : `Aujourd'hui · Semaine · Coach · Progrès`, quatre onglets au maximum. Le **profil** est un Stack hors onglets, ouvert par l'**avatar** d'Aujourd'hui. Le détail d'une séance (`activity/[id]`) porte aussi le débrief de course.
- Rôles : Aujourd'hui = maintenant · Semaine = la semaine, prévue et faite · Coach = aide, seule saisie libre vers l'IA · Progrès = tendances et courses.
- **Amendement maquettes v3.4 (accepté le 2026-11-08, ADR-012)** — on fait tout comme les écrans des maquettes : le détail d'une séance, la semaine passée et le débrief de course s'empilent **dans l'onglet** (barre d'onglets visible) ; le débrief « Ta course en trois temps » redevient un écran (ouvert directement depuis Progrès › Tes semis) ; le profil s'ouvre en **modale** (« Fermer ») avec Données et Réglages ; l'onboarding tient en 4 questions (niveau, équipement, objectif, accompagnement).
- **Modules activables** (Profil › Modules) : ils ajoutent des sections dans Semaine ou Progrès, sans sélecteur à l'écran ni onglet. En bêta, seul **Sport** est actif ; Nutrition est désactivé par défaut, Objectifs et Forme n'ont plus d'interface.

## Vue d'ensemble

| # | Jalon | Statut |
|---|---|---|
| 0 | Fondations techniques | ✅ |
| 1 | UI v1 en données mockées (4 onglets) | ✅ |
| 2 | Onboarding & calculs nutritionnels (local) | ✅ |
| 3 | Socle modulaire & contrats de données | ✅ |
| 4 | UX v2 « zéro cliquodrome » (sur mocks) | 🔧 |
| 5 | Backend, comptes & conformité de base | ⏳ |
| 6 | Agent Core (passerelle LLM, propositions, évals) | ⏳ |
| 7 | Nutrition IA réelle (photo, langage naturel, code-barres) | ⏳ |
| 8 | Données d'activité & santé réelles (providers) | ⚠️ |
| 9 | Coach IA : plan par intention, adaptation, brief, revue | ⏳ |
| 10 | Nutrition périodisée & recettes | ⏳ |
| 11 | Monétisation : paywall & essai 7 jours | ⏳ |
| 12 | Qualité, béta & lancement v1.0 | ⏳ |
| 13 | Planning & agenda | ⏳ |
| 14 | Objectifs court / long terme (sections de Semaine et Progrès) | ⏳ |
| 15 | Habitudes & streaks | ⏳ |
| 16 | Sommeil & énergie v2 | ⏳ |
| 17 | Productivité (tâches, Pomodoro, dictée de journée) | ⏳ |
| 18 | Récompenses (optionnel) | ⏳ |
| 19 | Ouverture : MCP, API, widgets, mode coach | ⏳ |

**🎯 Voie MVP (chemin critique, voir section dédiée)** : M1 Moteur d'analyse ✅ · M2 Écran d'analyse sur données réelles 🔧 · M3 Coach IA ⏳ (🚪 porte 1) · M4 Données testeurs ⏳ · M5 Profils, consentements, programmes sans IA ⏳ (🚪 porte 2) · M6 Bêta privée ⏳ (🚪 porte 3).

**🎨 Refonte v3.1 (branche `refonte`, voir section dédiée)** : coquille ✅ · composants ✅ (à compléter pour les maquettes v3.4) · `groupSessions` et source ✅ · écrans 🔧. Bêta limitée au sport.

**Correspondance avec l'ancienne roadmap** : ancien J3 → J5 · J4 → J7 · J5 → J8 · J6 → J11 · J7 → J9 · J8 → J9 (objectif de course) · J9 → J10 · J10 → J12 · J11 → J14/J15 · J12 → J18 · J13 → J16 · J14 → J17.

---

# 🎨 Refonte v3.1 — « Phrase d'abord, chiffre ensuite »

> Branche `refonte`, état de départ figé par le tag `pre-v3`. Spécification : `docs/SPEC-v3.md`. Tokens : `src/design/theme.ts`.
> **Maquettes : `docs/maquettes/v3.4/`** (planche de direction `001`, écrans `102` à `216`, clair et sombre). **On fait tout comme les écrans des maquettes** ; les points non maquettés sont tranchés dans `docs/questions.md` (Q1 à Q6).
> Décisions : ADR-011 (styles sans NativeWind), ADR-012 (navigation à 4 onglets, amendement v3.4 accepté), ADR-013 (source des activités et IA).
> **Bêta limitée au sport.** Nutrition, scan d'assiette, module Objectifs et Forme : interface supprimée (récupérable depuis `pre-v3`), couche données conservée, modules désactivés par défaut.
> **Ordre imposé** : on ne commence une étape qu'une fois la précédente terminée (typecheck, lint, tests verts).

1. **Socle et décisions**
   - [x] `src/design/` : tokens, `useTheme` (clair / sombre système), `makeStyles`, polices Inter / Inter Tight sous écran de démarrage
   - [x] ADR-011 + garde-fous ESLint `pulsefit/no-literal-style` et `pulsefit/no-classname`, exceptions temporaires par étape
   - [x] Tag `pre-v3`, inventaire des fichiers, ADR-012 et ADR-013
2. **Coquille de navigation** (ADR-012) : 4 onglets, TabBar v3.1, Stack `profile/` ouvert par l'avatar, `activity/[id]`, onboarding ; les écrans supprimés (nutrition, scan, Objectifs, Forme, historique, `/race/[id]`, `/preview-stats`) sont retirés des routes, mais leur ancien code reste compilable jusqu'à sa réécriture
   - [x] Routes et TabBar
   - [x] Écrans supprimés retirés des routes (ancien code conservé et compilable) ; modules nutrition, Objectifs et Forme désactivés par défaut
3. **Composants** (`docs/SPEC-v3.md`), chacun avec ses états, son accessibilité et le texte agrandi
   - [x] `CoachCard` · [x] `HeroMetric` · [x] `SessionCard` · [x] `EffortPill` · [x] `ProposalCard` · [x] `EmptyState` (journal du 2026-11-04)
   - [ ] Galerie de dev des composants (relecture visuelle humaine)
   - [ ] Écarts avec les maquettes v3.4 (SPEC-v3 §1 à §6) : `EffortPill` échelle prévue « Facile · Soutenu · Intense » ; question de `CoachCard` qui garde la puce choisie au lieu de se replier ; libellés débutant de `SessionCard` (« Plus tard ») et ressenti après maintien
   - [ ] Composants complémentaires (SPEC-v3 §7) : `BackHeader`, `ScreenHeader`, `SourceChip`, `WeekList`, `PastWeekRow`, `DayDots`, `WeekBars`, `PeriodCard`, `SegmentedControl`, `RaceList`, `PaceSteps`, `NumberedList`, `OptionCard`, `StepHeader`, `ConsentBlock`, `SettingsGroup`, ajoutés à la galerie
4. **`groupSessions` et source des activités** (`src/core/`, testés)
   - [x] `groupSessions(activities, overrides)` : règle v1 (même sport, écart ≤ 15 min, même jour, ≤ 4 h), rôles, overrides `split` / `merge` / `role` ; vérifier le seuil de 15 min sur l'export réel avant de le figer
   - [x] ADR-013 : `source` et `aiEligible` sur `Activity`, déduplication en faveur de la source non-Strava, `AthleteSummary` sans activité non éligible ni ses agrégats (séances mixtes exclues), champ `device`
   - [ ] Jeux synthétiques versionnés dans `fixtures/synthetic/` (débutant, coureur du dimanche, sportif équipé ; aucune donnée réelle), base de développement de M3
5. **Écrans** (SPEC-v3, « Écrans ») : Aujourd'hui → Semaine → détail d'une séance → Coach, puis Progrès et débrief, Profil, onboarding. Toutes les maquettes existent (`docs/maquettes/v3.4/`).
   - [ ] **Niveau déclaré** dans `src/core/` : `AthleteProfile.level` (`beginner | regular | advanced`, existe déjà) et `hasHrDevice` réglés par l'onboarding, textes d'intensité et choix du héros par niveau (SPEC-v3 « Niveau déclaré »), consigne sans bpm quand il n'y a pas de cardio ; testé
   - [x] **Routes selon l'amendement de l'ADR-012** : détail, semaine passée et débrief empilés dans l'onglet, profil en modale ; `openActivity`, `openWeek`, `openDebrief` dans `src/ui/nav.ts`
   - [ ] **Aujourd'hui** (`102`, `105`) : surtitre date · phase, « Bonjour, prénom », avatar ; séance du jour ; proposition compacte ou parole du coach ; carte « Ta semaine » du débutant
   - [ ] **Semaine** (`104`, `215`) : période et objectif (J-n), sept jours, ligne du jour, proposition en attente en indigo, validés avec ressenti pour le débutant ; « Avant » avec les semaines passées
   - [ ] **Semaine passée** (`109`) : sept jours en cercles, contenu ou `EmptyState noImport` + parole du coach
   - [ ] **Détail d'une séance** (`106`, `107`, `108`, `215`) : `SourceChip`, héros choisi par core, trois temps / quatre quarts / zone travaillée / ressenti, « Séparer »
   - [ ] **Coach** (`103`, `214`) : à décider, fil, proposition à plusieurs lignes avec question obligatoire, « Appliqué » + « Voir la semaine », bandeau « Plan modifié · Annuler », historique — _premier passage livré le 2026-11-08, à vérifier contre `214`_
   - [ ] **Progrès** (`211`) : Semaine · Mois · Année, période avec héros et barres, régularité, « Tes semis » et record ; sous le seuil : « Ta progression arrive. » et « Déjà fait »
   - [ ] **Débrief de course** (`212`) : « Ta course en trois temps », graphique en marches (allure, FC, objectif), trois temps commentés, « La prochaine fois » / « Pour ton objectif »
   - [ ] **Profil** (`213`) en modale : Toi (niveau, équipement avec alerte, objectif), Personnalisation (niveau choisi, analyser mes séances, envoyer un résumé à l'IA avec date d'accord), Données, Réglages (apparence, modules)
   - [ ] **Profil › Données** (`213`) : sources et volume, ce qui manque, bascule « Regrouper les séances », export JSON, suppression (droits RGPD, **obligatoires avant la bêta**)
   - [ ] **Profil › Réglages** : apparence et Modules (non maquetté ; revoir le texte de Modules qui évoque encore Plan et Suivi)
   - [ ] **Onboarding** (`210`, `216`) : remplace l'actuel, quatre questions — niveau, équipement, objectif (temps visé et date pour une course), accompagnement (niveaux 0 / 1 / 2, accord IA obligatoire pour le niveau 2, encadré Strava). Sexe, taille, poids, objectif de poids, niveau d'activité et âge ne sont plus demandés
   - [ ] `eslint-rules/legacy-exceptions.js` vide, puis retrait de NativeWind, Tailwind, `global.css` et des anciens tokens
- **DoD** : chaque écran ci-dessus correspond à sa maquette v3.4 en clair et en sombre (relecture humaine sur appareil) ; texte agrandi à 1,3 vérifié ; aucune exception ESLint restante ; NativeWind retiré ; aucune activité Strava ni agrégat Strava dans un résumé IA (test).

---

# 🚀 Voie rapide — Alpha perso (1 utilisateur : toi)

> **Objectif** : une version utilisable au quotidien par toi seul, le plus vite possible. Elle **réutilise les jalons ci-dessous en les allégeant** ; rien n'est jeté pour la suite (les repositories permettent de passer du local à Supabase sans toucher l'UI).
> Pas de multi-utilisateur, pas de paywall, pas de conformité RGPD à porter (ce sont tes propres données).

**Choix techniques de l'alpha (ADR-007, proposé)**
- Données **local-first** sur le téléphone (SQLite ou AsyncStorage derrière les repositories), aucun backend de données.
- **Proxy IA minimal** (Edge Function ou petit serveur) : clé LLM côté serveur, plafond de dépense, journal de coût, **aucune donnée stockée côté serveur**.
- Sources d'activité : **export FIT COROS** (import via le partage du téléphone) + **Apple Health** (FC, sommeil, poids).
- Build : EAS development build ou TestFlight interne sur ton téléphone.

| Étape | Contenu | Jalons réutilisés |
|---|---|---|
| A1 | Socle léger : schémas Zod, repositories, bilan du jour unique, `ProposalCard` | J3 (sans registre complet) |
| A2 | UX v2 : navigation `Accueil · Plan · Agent · Suivi · Stats`, Agent en 3 zones (agent mock), modules activables, flux Accueil | J4 |
| A3 | Proxy IA, sorties structurées validées, journal de coût | J6 (version minimale) |
| A4 | Scan d'assiette + saisie en langage naturel | J7 |
| A5 | Import FIT COROS + Apple Health + calcul de charge | J8 (sans Strava) |
| A6 | Coach : plan par intention, adaptation quotidienne, brief généré à l'ouverture de l'app | J9 |
| A7 | Usage quotidien pendant 2 semaines + journal des frictions | — |

- **Critère de sortie** : tu l'utilises tous les jours pendant 2 semaines sans ouvrir une autre app pour le sport et la nutrition.
- **Volontairement reporté** : comptes, Supabase, RGPD, paywall, Strava, brief par cron serveur (donc pas de brief automatique à heure fixe), multi-appareils.
- **Passage à la béta publique** : reprendre les jalons J5 (backend UE + RLS + consentement), J6 complet, J8 complet, J11, J12.

---

# 🎯 Voie MVP — Analyse IA sur données réelles & bêta privée (jalons M1 à M6)

> **Objectif** : un premier visuel d'analyse IA sur **tes vraies données** (~2 semaines de dev), puis une bêta privée de 10 à 15 testeurs (~2 à 3 semaines plus tard). Sources : [`Semi en 1h45 & intégration de l'analyse dans PulseFit`] et [`PulseFit — plan MVP analyse IA sur données réelles et bêta`] (analyses Claude du 2026-11-01).
> **Cette voie remplace la « Voie rapide — Alpha perso » comme chemin critique** et réutilise les jalons J5/J6/J8/J9/J11/J12 en les allégeant. Numérotation **M1–M6** pour ne pas casser les références J0–J19. Ne pas ouvrir M(n+1) tant que la porte de M(n) n'est pas franchie.
> **Priorité** : la voie MVP passe avant la fin du J4 (UX v2). Les écrans que M3 réutilise sont désormais ceux de la refonte v3.1 (Aujourd'hui, Semaine, Coach, Progrès, détail d'activité).

## Principe : trois niveaux de personnalisation
Un moteur de règles sert tous les profils ; le coach IA est une couche **optionnelle**. Chaque niveau est proposé, jamais exigé, modifiable dans Profil.

| Niveau | L'utilisateur partage | Où ça tourne | Il reçoit |
|---|---|---|---|
| 0 — Profil déclaré | Réponses d'onboarding : niveau, objectif, jours dispos, matériel | Règles + bibliothèque de programmes, sur le téléphone | Un programme adapté, réajusté chaque semaine par un check-in de 3 questions |
| 1 — Données d'activité | Apple Santé / Health Connect, ou import Strava (fichier) | Moteur d'analyse déterministe, sur le téléphone | Programme ajusté sur le réel + cartes de constats rédigées par modèles de texte |
| 2 — Coach IA | Accord explicite pour envoyer un résumé sans nom ni identifiant | Edge Function → Claude (Bedrock UE à terme) | Analyses rédigées, débriefs de course, questions, plan révisé |

Aux niveaux 0 et 1, **aucune donnée d'activité ne quitte le téléphone**. Le serveur ne stocke que profil, consentements et retours de bêta. Le vocabulaire suit le profil (« ralentis un peu » pour un débutant, « reste sous 150 bpm » pour un sportif).

| Profil testeur | Point d'entrée | Ce qui compte |
|---|---|---|
| Veut s'y mettre | Niveau 0, programme « Débuter » (marche/course) | Séances courtes, régularité, aucun jargon |
| Coureur du dimanche | Niveau 0 ; niveau 1 proposé | Objectif 5/10 km, 2–3 séances/sem, reprise douce |
| Sportif équipé (Garmin, COROS, Strava) | Niveau 1 dès l'onboarding ; niveau 2 proposé | Analyse fine : intensités, charge, débrief, préparation d'objectif |

## Règles d'architecture propres à cette voie
- Le moteur d'analyse vit dans **`src/core/training/`** (convention du repo ; le plan source disait `src/domain/training/`) : TypeScript pur, sans React Native ni réseau. **Le même code tourne sur le téléphone et dans l'Edge Function.**
- **Cadre légal Strava (ADR-013)** : seul un **fichier exporté et importé par l'utilisateur** est envisagé (≠ API Strava, interdite pour l'IA). Chaque activité porte `source` et `aiEligible`, toujours faux pour Strava : **aucune donnée Strava, ni ses agrégats, dans un prompt** (règle 9 d'AGENTS.md). Le moteur local (niveaux 0–1) n'est pas concerné. Lecture des conditions Strava à valider juridiquement avant M6.
- **Données personnelles** : le snapshot issu de ton export (`fixtures/*.snapshot.json`) et le zip Strava sont **gitignorés, jamais committés**. Les tests du moteur s'appuient sur un jeu **synthétique** reproduisant les chiffres de référence ; le test sur ta vraie donnée est local seulement (`npm run test:local`, ignoré en CI).
- Tout `AthleteSummary` envoyé à un LLM : < 2 000 tokens, agrégé, sans nom ni identifiant, validé par Zod ; sortie `CoachResponse` validée par Zod (1 retry, repli propre).

## Prérequis à lancer dès maintenant (comptes à délai de validation)
- [ ] Apple Developer Program (~99 €/an) : obligatoire pour HealthKit et TestFlight
- [ ] Google Play Console (25 $) — seulement si ≥ 3 testeurs Android (sinon bêta iPhone seule, Health Connect reporté après la bêta)
- [ ] Clé API Anthropic pour le dev de M3 (**uniquement côté serveur / `.env` local non committé**)
- [ ] Compte AWS + modèles Claude activés dans Bedrock région UE, avant M6
- [ ] Projet Supabase région UE ; comptes PostHog (UE) et Sentry
- [ ] Liste de 10 à 15 testeurs : profil, iPhone/Android, montre

## Jalon M1 — Moteur d'analyse sur tes données ✅ (2 à 3 jours)
> Réutilise J3 (schémas Zod) et amorce `core/load` de J8.
- [x] **ADR-004 (version courte)** : autoriser l'import de fichier utilisateur pour le moteur local ; décider si un résumé agrégé issu de cet import peut alimenter le coach (sinon M3 fonctionne sur Apple Santé / FIT seulement)
- [x] `src/core/training/types.ts` (+ schémas Zod) : `Activity`, `Split`, `DailyMetrics`, `Race`, `AthleteProfile`, `Insight` (réutiliser les entités existantes de J3 plutôt que dupliquer)
- [x] `scripts/import-strava.ts` (Node) : lit le zip, parse `activities.csv` (dates en français, colonnes en double) et les FIT (`fit-file-parser`, ajout de dépendance → mini-ADR), écrit `fixtures/julien.snapshot.json` (**gitignoré**)
- [x] `src/core/training/engine/` (fonctions pures) : volume par semaine / mois, régularité et coupures, zones de FC (FC max configurable), répartition des intensités, efficacité aérobie par trimestre, détection de courses + débrief (allure et FC par tranche, dérive cardiaque, recalage sur distance officielle), préparation sur 8 semaines
- [x] `src/core/training/insights/` : règles → `Insight` (gravité, titre, texte version débutant / version sportif, chiffres à l'appui, « Pourquoi ? »)
- [x] Tests : jeu synthétique + test local sur tes données avec les valeurs de référence (53 % des sorties > 160 bpm de moyenne, Reims 2025 en 1h50:50, Paris 2024 en 1h48:16, FC max observée 201 bpm, etc.)
- **Fini quand** les tests passent et le snapshot local est généré.

## Jalon M2 — L'écran d'analyse avec tes vraies données 🔧 (3 à 4 jours)
> Réutilise Accueil / Suivi / Stats du J4. Expo Go suffit.
- [x] Charger le snapshot dans le store derrière un drapeau de dev `EXPO_PUBLIC_USE_FIXTURE` (via un adaptateur de repository, pas d'import direct dans l'UI)
- [ ] **Stats / Suivi › Sport** : volume par semaine, répartition des intensités, tendance d'efficacité aérobie — _partiel : calculs `src/core/training/engine/trends.ts` testés + carte « Tendances › Sport » hors sélecteur (8 sem / 12 sem / 6 mois, ligne « FC absente ») ; FC max configurable dans Profil (saisie > observée filtrée 12 mois > Tanaka) ; reste le volet Suivi et la relecture visuelle_
- [ ] **Accueil** : carte « Analyse » avec les 2–3 constats prioritaires
- [x] Écran **Débrief de course** (`app/race/[id].tsx`) : allure et FC par tranche, comparaison avec les courses précédentes — _fondu dans le détail d'activité par la refonte v3.1 (ADR-012)_
- [ ] Pouce haut / bas sur chaque carte, stocké en local (champ ajouté à `partialize`)
- **Fini quand** tu vois tes données et tes constats sur ton téléphone.

## Jalon M3 — Coach IA ⏳ (3 jours) — 🚪 Porte 1
> Version minimale de J6 + première tranche de J9.
- [ ] Projet Supabase UE, Edge Function `coach` (aucune donnée stockée côté serveur à ce stade)
- [ ] Entrée `AthleteSummary` (calculé par le moteur, < 2 000 tokens, sans identifiant) ; sortie `CoachResponse` Zod (résumé, constats, recommandations, alertes) ; garde-fous : pas d'allégation médicale, pas de conseil en cas de douleur
- [ ] Prompts v1 versionnés dans `supabase/functions/coach/prompts/` : analyse du jour, bilan hebdo, débrief de course
- [ ] Fournisseur : API Anthropic en dev sur tes propres données, Bedrock UE avant d'inviter des testeurs ; même interface, bascule par variable d'environnement
- [ ] Cache d'une analyse par jour et par utilisateur ; plafond de coût ; journal de coût (sans contenu des prompts)
- [ ] Carte « Coach » dans Accueil avec pouce haut / bas
- [ ] (Si ADR-004 OK) Objectif « semi en 1h45 » : bloc de 12 semaines proposé en `Proposal`, **validé par `core/planValidator`** (hausse ≤ 10 %/sem, semaine allégée toutes les 3–4 sem.)
- **Fini quand** tu lis sur ton téléphone une analyse IA de tes vraies données. **Porte 1.**

## Jalon M4 — Les données des testeurs ⏳ (5 à 7 jours, parallèle de M5)
> Allège J8 (pas d'API Strava, pas d'API Garmin/COROS directes).
- [ ] Build de dev EAS (HealthKit / Health Connect indisponibles dans Expo Go)
- [ ] Interfaces `ActivityProvider` / `HealthProvider` ; adaptateur **HealthKit** (`@kingstinct/react-native-healthkit`, compatibilité SDK 57/58 à vérifier) : séances, FC, distance, sommeil, FC repos, HRV, poids ; 12 mois d'historique puis synchro incrémentale
- [ ] Adaptateur **Health Connect** (seulement si ≥ 3 testeurs Android)
- [ ] Import allégé du fichier Strava : `activities.csv` seul d'abord (volume, durée, FC moyenne), FIT ensuite ; écran Profil → « Importer mon historique »
- [ ] Écran d'aide « Synchroniser ta montre » (Garmin Connect, COROS, Samsung → Apple Santé / Health Connect)
- [ ] Dédoublonnage entre sources : départ à 2 min près, distance à 3 % près ; on garde la source non-Strava (ADR-013)
- [ ] (Optionnel, après la bêta) connexion COROS via MCP + export du bloc d'entraînement vers la montre
- **Fini quand** un testeur iPhone (et Android le cas échéant) voit son historique dans Suivi.

## Jalon M5 — Profils, consentements, programmes sans IA ⏳ (5 jours, parallèle de M4) — 🚪 Porte 2
> Allège J2/J5/J9 : tout fonctionne sans IA ni compte.
- [ ] Onboarding en 4 questions (maquette `210`) : niveau (« Je débute · Je cours un peu · Je m'entraîne »), équipement (montre avec cardio, téléphone, rien), objectif (semi, 10 km, courir 5 km sans m'arrêter, courir plus régulièrement ; temps visé et date pour une course), accompagnement ; rappel « consulte un médecin en cas de doute » pour les débutants. Jours disponibles et durée par séance ne sont pas demandés : déduits de l'historique ou dits au Coach (Q5)
- [ ] Consentement aux 3 niveaux = étape 4 de l'onboarding (« Avec mon profil · Avec mes séances · Avec un coach IA », accord « J'accepte cet envoi »), **versionné et horodaté**, modifiable dans Profil › Personnalisation (table `consents` en M6)
- [ ] Bibliothèque de programmes JSON : Débuter (marche/course, 8 sem.), 5 km, 10 km, semi 12 sem., reprise après coupure, renforcement 2×/sem.
- [ ] Générateur déterministe (`src/core/training/programs/`) : choix du modèle et du calibre selon volume déclaré ou mesuré + jours dispos → affiché dans Semaine
- [ ] Règles d'ajustement : +10 % de volume max/sem., séance manquée décalée, semaine allégée toutes les 3–4 sem.
- [ ] Check-in hebdo niveau 0 en 3 taps : séances faites, fatigue 1–5, envie de continuer
- **Fini quand** un débutant sans données et un sportif équipé obtiennent chacun un plan qui leur parle. **Porte 2.**

## Jalon M6 — Bêta privée ⏳ (3 jours) — 🚪 Porte 3
> Version minimale de J5 + J12 (pas de paywall J11 pendant la bêta).
- [ ] Auth Supabase (Sign in with Apple + lien magique), **RLS sur toutes les tables + tests des politiques** (profil, consentements, retours)
- [ ] Distribution : TestFlight (iOS) ; test interne Google Play / APK EAS si Android
- [ ] PostHog (UE) + Sentry avec **scrubbing** (aucun contenu de prompt ni donnée de santé)
- [ ] Bouton « Un retour ? » sur chaque écran (texte + capture), pouces remontés au serveur
- [ ] Page de confidentialité, suppression du compte et des données depuis l'app, export RGPD
- [ ] Verrou 18+ pour les objectifs de perte de poids ; consentement données de santé (AIPD à rédiger)
- **Fini quand** 10 testeurs ont installé l'app, répartis sur les 3 profils. **Porte 3.**

## Bêta : 4 semaines pour apprendre
10 à 15 testeurs, une question précise par profil : *Veut s'y mettre* → Débuter les fait-il démarrer puis tenir 3 semaines ? · *Coureur du dimanche* → check-in + ajustements suffisent-ils sans montre ? · *Sportif équipé* → l'analyse apprend-elle quelque chose que Garmin/Strava ne donnent pas ? acceptent-ils le coach IA ?

**Déroulé** : S0 appel de 15 min par testeur (observer sans aider) · S1–4 groupe WhatsApp, une question chaque lundi + bouton de retour · fin S2 : 5 entretiens de 10 min · fin S4 : questionnaire de 5 questions (« Serais-tu déçu si l'app disparaissait ? », « Combien la paierais-tu par mois ? »).

| Mesure | Source | Seuil d'alerte |
|---|---|---|
| Rétention 7 et 28 jours | PostHog | < 50 % actifs à 7 jours |
| Séances du plan réalisées | Check-in / données | < la moitié |
| Cartes jugées utiles | Pouces | < 60 % de pouces hauts |
| Passage au coach IA | Consentements | < 1/3 des sportifs équipés |

**Décisions après 4 semaines** : débutants qui décrochent → simplifier, rappels et séries avant toute nouvelle fonction · sportifs sans valeur perçue → approfondir l'analyse (charge, débrief) et brancher COROS/Garmin en direct · peu d'acceptation du coach IA → retravailler l'apport et la présentation · demande transverse (muscu, nutrition, sommeil) → jalon suivant. L'app n'émet aucun conseil en cas de douleur : elle oriente vers un professionnel.

## Articulation avec les jalons existants
| Voie MVP | Jalons réutilisés | Reporté après la bêta |
|---|---|---|
| M1 | J3, `core/load` de J8 | — |
| M2 | J4 (Accueil, Suivi, Stats) | Animations, test des 5 secondes |
| M3 | J6 minimal, J9 (analyse, débrief, plan par intention) | Brief cron, évals complètes |
| M4 | J8 (HealthKit, FIT/CSV) | API Strava, Garmin/COROS directs |
| M5 | J2, J9 (plan sans IA) | Nutrition périodisée (J10) |
| M6 | J5, J12 (béta) | Paywall (J11), nutrition IA (J7), Phase 2 |

**Nutrition / scan d'assiette (J7, J10)**, **module Objectifs** et **Forme** : hors périmètre de la bêta MVP, limitée au sport ; leur interface est retirée par la refonte v3.1 (récupérable depuis le tag `pre-v3`). Ils ne redémarrent qu'après lecture des résultats de la bêta (une demande nutrition récurrente en fait le jalon suivant).

---

# Phase 1 — MVP « Coach endurance IA »

## Jalon 0 — Fondations techniques ✅
- [x] Expo SDK 57 + Expo Router + TypeScript strict
- [x] NativeWind + design system (tokens sémantiques)
- [x] Store Zustand persisté (AsyncStorage)
- [x] Données mockées, lint, typecheck, dépôt GitHub

## Jalon 1 — UI v1 en données mockées ✅
- [x] 4 onglets, thème clair / sombre, composants partagés
- [x] Aujourd'hui, Sport, Nutrition, Profil (mock) + états vides / erreur
- [x] Test sur iPhone et Android (Expo Go)

## Jalon 2 — Onboarding & calculs nutritionnels ✅
- [x] Onboarding, BMR Mifflin-St Jeor, TDEE, macros, rythme kg/semaine (7700 kcal/kg), plancher 1200 / 1500 kcal
- [x] Recalcul automatique, tests unitaires de `lib/`

## Jalon 3 — Socle modulaire & contrats de données ✅
> Pourquoi maintenant : l'UI est construite sur des mocks. Fixer les contrats avant d'ajouter des écrans évite de tout reprendre au backend.
- [x] ADR-001 : architecture modulaire (`core / modules / agent / data / ui`)
- [x] Réorganiser le dépôt selon l'arborescence cible (déplacer `lib/` vers `src/core/`, sans changer le comportement)
- [x] Schémas Zod : `Profile`, `Meal`, `FoodItem`, `PlannedWorkout`, `Activity`, `TrainingPlan`, `Goal`, `Insight`, `Proposal`, `DailyBrief`
- [x] Interfaces de repositories + adaptateur **mock** + adaptateur **local** ; l'UI n'importe plus les mocks
- [x] `LifeModule` + registre de modules ; migrer Sport, Nutrition et Profil comme premiers modules
- [x] Composant `ProposalCard` + store des propositions (Valider / Modifier / Refuser / Annuler)
- [x] **Source unique du bilan du jour** : sélecteur `getDailyBalance(date)` utilisé par *Aujourd'hui* et *Nutrition* (corriger l'écart actuel : 2250 kcal restantes vs objectif 2270 affiché)
- [x] Test d'invariant : la somme kcal des macros (P×4 + G×4 + L×9) = objectif ±1 % (aujourd'hui 140 P / 255 G / 63 L → 2147 kcal pour 2270)
- [x] Feature flags par module
- **DoD** : l'app tourne à l'identique avec la nouvelle structure ; ajouter un module factice « test » ne demande aucune modification de la navigation.

## Jalon 4 — UX v2 « zéro cliquodrome » 🔧
> Refonte ergonomique sur les mocks, avant de brancher la vraie IA.
> **Navigation et écrans remplacés par la refonte v3.1** (ADR-012) : les tâches ouvertes ci-dessous ne sont reprises que si la refonte en a besoin.
- [x] ADR-002 : acter la navigation **validée** `Aujourd'hui · Plan · Agent · Suivi · Moi` (les onglets Sport et Nutrition disparaissent ; leurs écrans migrent dans *Suivi* via un sélecteur de module, la saisie passe par *Aujourd'hui* et la CommandBar)
- [ ] **CommandBar** : champ texte + dictée vocale ; au début, `MockAgent` qui renvoie des `Proposal` conformes au schéma
- [x] **Aujourd'hui = flux d'actions** : carte « Maintenant » (prochaine action) → bilan kcal → séance du jour validable en 1 tap → propositions en attente → brief IA (placeholder)
- [x] Supprimer les doublons d'affichage (macros en-tête vs carte « Apports du jour » dans Nutrition)
- [x] Remplacer le formulaire « Forme / Temps max / Régénérer » par : valeurs **inférées** + phrase libre dans la CommandBar (« claqué, 45 min max ») ; garder des chips rapides facultatives
- [ ] Saisie repas : appareil photo direct (appui long sur le bouton scan), **repas habituels suggérés selon l'heure** (1 tap), « comme hier », saisie en langage naturel
- [ ] Séance du jour : validation automatique quand l'activité correspondante arrive (prévoir l'UI d'annulation)
- [ ] Détail d'activité : emplacement « Analyse IA » (3 constats + 1 conseil, placeholder)
- [ ] Barre d'énergie : afficher le « Pourquoi ? » (facteurs et poids)
- [ ] Charte des zones tactiles et d'accessibilité (taille mini, contraste, Dynamic Type) ; s'assurer qu'aucun bouton d'action n'est collé aux bords (le bouton d'outils de dev Expo masque aujourd'hui le CTA de la carte séance)
- [x] Thème **Aurore** (jetons clair / sombre, Inter, barre à pad glissant, `HoldToConfirmCard`) — voir `docs/UX-V2.md` §12
- [ ] **Onglet Stats** : page unique (période Semaine / Mois / Année), une carte par module actif (Sport : total + histogramme ; Nutrition : moyenne kcal vs cible ; Forme), carte « Analyse de l'Agent » (placeholder) ; chiffres calculés dans `src/core/`
- [x] **Profil via le prénom cliquable** (dégradé, relief, chevron) ; écrans Profil et Profil › Modules ; retrait de l'onglet Moi
- [x] **Modules activables** : écran Profil › Modules (bascules), feature flags câblés au registre ; sélecteur à icônes (souligné glissant) dans Plan et Suivi, masqué si un seul module ; dernier choix mémorisé par onglet
- [x] **Navigation glissée** entre modules (balayage horizontal, souligné qui suit le doigt, ressort léger) + respect de `prefers-reduced-motion`
- [ ] **Plan › Sport** : afficher le plan (objectif + semaine) ; écran « sans plan » (création via l'Agent + modèles) ; plus de champ texte dans Plan
- [ ] **Plan › Nutrition** : cibles du jour (calculées par le code) + semaine de repas ; bouton « Planifier avec l'Agent »
- [ ] **Accueil « nutrition seule »** : carte « Ce soir · Dîner » (mock) quand le module Sport est désactivé
- [ ] **Agent en trois zones** : Demande · À valider (compteur) · Historique ; exemples visibles groupés par domaine, adaptés aux modules actifs et à l'heure ; boutons contextuels « Modifier / Planifier avec l'Agent » depuis les autres onglets
- [ ] Titres évocateurs + phrase de rôle sous chaque page ; **test des 5 secondes** sur 3 personnes (« ici, tu fais quoi ? »)
- [ ] Animations : souligné glissant, histogrammes en cascade, courbes progressives, compteurs ; durées 600–900 ms, une fois à l'ouverture
- [ ] **Tableau du budget de taps** par parcours clé (voir principes) validé sur device
- **DoD** : les parcours clés respectent le budget de taps ; aucun formulaire à plus de 2 champs ; une même donnée n'apparaît qu'une fois par écran ; **une seule saisie IA dans l'app (onglet Agent)** ; chaque page annonce son rôle et au moins 2 testeurs sur 3 le comprennent en 5 secondes.

## Jalon 5 — Backend, comptes & conformité de base ⏳
- [ ] ADR-003 : backend = Supabase (**région UE**) — Auth + Postgres + Storage + Edge Functions + pg_cron
- [ ] Projet, variables d'environnement, Auth (email magique, Sign in with Apple, Google)
- [ ] Migrations versionnées (`supabase/migrations`) : `profiles, meals, food_items, planned_workouts, activities, plans, goals, insights, proposals, agent_runs, consents`
- [ ] Row Level Security sur toutes les tables + **tests automatisés des politiques**
- [ ] Adaptateur Supabase des repositories ; synchronisation **offline-first** (file d'attente, résolution last-write-wins)
- [ ] **Consentement explicite données de santé** à l'onboarding (versionné, table `consents`), politique de confidentialité
- [ ] Suppression de compte in-app (obligatoire Apple) + export des données (RGPD)
- [ ] Verrou d'âge ≥ 18 ans pour les objectifs de perte de poids
- [ ] Sentry + PostHog **dès maintenant** (pas à la fin)
- [ ] Passage à un **EAS development build** (Expo Go ne suffira plus : santé, achats, caméra avancée)
- [ ] CI (GitHub Actions) : typecheck + lint + tests sur chaque PR
- **DoD** : un nouvel utilisateur crée un compte, retrouve ses données sur un autre appareil, peut tout exporter et tout supprimer.

## Jalon 6 — Agent Core ⏳
> Le moteur commun à tous les agents, présents et futurs.
- [ ] Edge Function `agent-gateway` : authentification, quotas, journalisation dans `agent_runs` (modèle, tokens, coût, latence)
- [ ] **Routeur de modèles configurable** (`agent/router.ts`) : tâche → niveau `small | medium | large` ; modèles dans un fichier de config (jamais en dur) ; repli automatique
- [ ] Sorties structurées validées Zod, 1 retry, repli propre
- [ ] Registre d'outils agent alimenté par les `agentTools` des modules : lecture libre (`get_profile`, `get_recent_activities`, `get_nutrition_summary`…), **écriture uniquement via `Proposal`**
- [ ] `buildUserContext()` : résumé déterministe des 4 à 8 dernières semaines (volume, allure, charge, poids, apports) ; pas de données brutes, pas d'identifiants
- [ ] Pipeline `Proposal` bout en bout : création → notification → validation / édition / refus → écriture → annulation
- [ ] Prompts versionnés dans `agent/prompts/`
- [ ] **Harnais d'évals** (`evals/`) : cas en JSON, scoring, exécutable en CI à chaque changement de prompt ou de modèle
- [ ] Garde-fous : pas d'allégations médicales ; détection des signaux à risque (déficit excessif vs charge d'entraînement, profils à risque de TCA) → message de prudence, pas de plan agressif
- [ ] Budget de coût par utilisateur et dégradation (modèle moins cher au-delà du quota)
- **DoD** : une phrase de l'utilisateur produit une `Proposal` valide, persistée, avec son coût loggé ; les évals tournent en CI.

## Jalon 7 — Nutrition IA réelle ⏳
- [ ] Edge Function « analyse d'assiette » (vision) ; clé côté serveur
- [ ] Upload de photo compressée ; suppression de la photo après analyse par défaut (option de conservation)
- [ ] JSON structuré : plat, aliments, portions, kcal, macros, **confiance**
- [ ] Confiance faible → **une seule question ciblée** de l'agent plutôt qu'une estimation hasardeuse ; repli Open Food Facts
- [ ] Écran de correction rapide (portions au curseur)
- [ ] **Saisie en langage naturel / dictée** (« 2 œufs, pain complet, un café ») → repas
- [ ] Scan de code-barres (Open Food Facts)
- [ ] Repas habituels appris (les plus fréquents par moment de la journée) → suggestions 1 tap
- [ ] Jeu d'évals : 50 à 100 photos annotées, métrique d'erreur kcal (MAPE) ; seuil minimal fixé avant le lancement
- [ ] Quotas et suivi des coûts par utilisateur
- **DoD** : logger un repas en ≤ 3 taps ; erreur kcal médiane mesurée et documentée.

## Jalon 8 — Données d'activité & santé réelles ⚠️
> ⚠️ **Gate légal Strava à lever avant toute implémentation Strava.** D'après la politique API Strava en vigueur (accord mis à jour le 1er juin 2026) et la FAQ développeurs, les données de l'API ne peuvent pas être utilisées dans des applications d'IA (prompts, embeddings, RAG, y compris données dérivées), et les apps qui exposent ces données à des outils d'IA tiers ne sont pas approuvées pour une capacité supérieure. Une nouvelle app est limitée à 1 athlète (10 en auto-upgrade) ; au-delà, revue obligatoire. **Lire l'accord API complet et trancher (ADR-004) avant de coder.**
> Conséquence d'architecture : le coach IA ne doit **pas** dépendre de Strava. Strava devient un provider optionnel.
- [ ] ADR-004 : stratégie de données d'activité (sources autorisées pour alimenter l'IA)
- [ ] Interfaces `ActivityProvider` / `HealthProvider` normalisant vers `Activity`, `SleepNight`, `BodyMetric`
- [ ] Provider **Apple Health / Health Connect** : activités, sommeil, FC repos / HRV, poids (permissions, lecture, build natif)
- [ ] Import manuel de fichiers **FIT / GPX** (données fournies par l'utilisateur)
- [ ] Évaluer les API directes (Garmin Connect, COROS, Polar, Wahoo) ou un agrégateur ; documenter conditions d'accès et conformité
- [ ] Provider Strava (**seulement si ADR-004 l'autorise**) : OAuth, tokens et refresh côté serveur, webhook (désautorisation obligatoire), throttling, charte graphique ; **aucune donnée Strava dans le contexte LLM** tant que la politique l'interdit
- [ ] Calories brûlées réelles → jauge d'Aujourd'hui
- [ ] `core/load` : volume hebdo, allure moyenne, charge (TRIMP ou ATL/CTL), tendance sur 4 semaines — calculs déterministes
- [ ] Appariement automatique séance prévue → activité réalisée
- [ ] Backfill 30–90 jours avec limitation de débit
- **DoD** : l'app affiche des activités et du sommeil réels, calcule la charge, valide automatiquement les séances, avec au moins une source dont l'usage IA est conforme.

## Jalon 9 — Coach IA ⏳ (cœur du MVP)
- [ ] **Intention → plan** : « Je prépare un semi en 1h45 dans 10 semaines, 4 séances, jamais le mercredi » (dictée ou texte) → l'agent croise profil + historique résumé → `TrainingPlan`
- [ ] Schéma `TrainingPlan` (semaines, séances typées, zones / allures, durée, intensité, `rationale`)
- [ ] **Validation déterministe du plan** (`core/planValidator`) : progression de charge ≤ ~10 %/semaine, semaines de décharge, cohérence avec l'historique, jours indisponibles respectés. L'IA propose, le code vérifie.
- [ ] Aperçu en `ProposalCard`, **édition en langage naturel** (« décale la sortie longue au dimanche »)
- [ ] Objectif de course (`Goal` de type course : date, temps visé, compte à rebours, plan à rebours) ; prédiction de temps (formule de Riegel)
- [ ] **Adaptation quotidienne automatique** : forme inférée (charge, sommeil, FC repos) + imprévu dicté ; remplace le formulaire Forme / Temps
- [ ] **Brief quotidien** (matin, cron serveur à l'heure locale) : bilan de la veille, plan du jour, kcal / macros ajustés, 1 à 3 actions
- [ ] **Revue hebdo** (dimanche) : analyse, conseils, proposition d'ajustement du plan et de la nutrition
- [ ] **Analyse IA d'une séance** après chaque activité : 3 constats + 1 conseil
- [ ] Barre d'énergie v1 explicable (« Pourquoi ? »)
- [ ] Notifications actionnables (valider / reporter)
- [ ] Évals : plans générés (respect des contraintes, cohérence de charge) sur 30 profils types
- [ ] (Optionnel) catalogue de courses v1 en JSON, en autocomplétion de la CommandBar
- **DoD** : de la phrase au plan validé en moins de 30 secondes ; le plan respecte 100 % des règles du validateur ; le brief du matin est généré sans action de l'utilisateur.

## Jalon 10 — Nutrition périodisée & recettes ⏳
- [ ] Cibles kcal / macros **par jour selon la séance prévue** (jour dur → plus de glucides)
- [ ] TDEE adaptatif : recalcul à partir de la tendance de poids vs apports réels
- [ ] Garde-fous de déficit selon la charge d'entraînement (risque de déficit énergétique relatif) + messages de prudence
- [ ] Base de recettes (kcal, macros, temps, tags) ; **suggestions selon le restant du jour** et avant / après séance ; filtres ; favoris
- [ ] Plan de ravitaillement pour une course (fueling)
- [ ] Liste de courses générée (`Proposal`)
- [ ] **« Ce soir ? »** : proposition de dîner calculée sur les kcal et macros restants + base d'habitudes (carte d'Accueil et exemple de l'Agent) ; kcal recalculés par le code
- **DoD** : les objectifs nutritionnels varient avec le plan d'entraînement et restent dans les garde-fous.

## Jalon 11 — Monétisation : paywall & essai 7 jours ⏳
> À démarrer dès que J7 + J8 sont livrés, en parallèle de J9–J10.
- [ ] RevenueCat (`react-native-purchases`) ; produits mensuel + annuel avec essai 7 jours (App Store Connect / Play Console)
- [ ] Entitlement `premium` (build EAS requis)
- [ ] Gating cohérent avec les coûts IA : gratuit = jauge, journal, historique, quelques scans ; premium = scans illimités, coach, brief, revue hebdo
- [ ] Paywall après le **premier moment de valeur** (premier plan validé ou premier brief), pas à froid
- [ ] Écran paywall : une promesse, 2 offres, restauration des achats ; liens CGU et confidentialité
- [ ] Profil : statut d'abonnement + « Gérer mon abonnement »
- [ ] Mesurer : conversion essai → payant, MRR, **coût IA / revenu par utilisateur**
- **DoD** : le coût IA moyen reste sous ~15 % du revenu par abonné.

## Jalon 12 — Qualité, béta & lancement v1.0 ⏳
- [ ] Tests de parcours critiques (jest-expo + e2e type Maestro) ; évals en CI
- [ ] Profils EAS (development / preview / production) ; OTA (EAS Update)
- [ ] **Béta fermée** : TestFlight + test interne Play, 20 à 50 utilisateurs
- [ ] Tableau de bord produit : rétention J7 / J30, propositions acceptées (%), repas loggés / jour, coût IA / utilisateur
- [ ] Mentions légales, politique de confidentialité (données de santé), CGU ; vérification RGPD et, si besoin, avis juridique sur l'hébergement de données de santé
- [ ] Fiches stores, captures, icône
- [ ] 🚀 Publication v1.0
- **Critères go / no-go** : rétention J30 > 25 % · propositions acceptées > 40 % · erreur kcal médiane sous le seuil fixé en J7 · 0 incident de sécurité.
- **Critère d'alerte** : rétention J30 < 15 % → pivoter (angle coach, serveur MCP) avant d'ajouter des fonctionnalités.

---

# Phase 2 — Life OS (modules)
> Chaque jalon = un module qui s'enregistre via `LifeModule` : cartes dans *Aujourd'hui*, sections dans *Semaine*, cartes de tendances dans *Progrès*, outils pour le coach, analyseurs quotidiens / hebdo. **Aucun nouvel onglet.**

## Jalon 13 — Planning & agenda ⏳
- [ ] Entité `CalendarEvent`, section Agenda dans *Semaine*
- [ ] Import du calendrier en lecture seule (Apple / Google)
- [ ] **Time-blocking par l'agent** : « place mes 4 séances autour de mon agenda » → `Proposal`
- [ ] Détection de conflits ; disponibilités injectées dans le coach (J9)

## Jalon 14 — Objectifs court / long terme ⏳
- [ ] Sections **Objectifs** dans Semaine et Progrès (progression par objectif) ; le module existe, désactivé par défaut, sans interface depuis la refonte v3.1
- [ ] `Goal` (court / long terme) avec jalons et tâches
- [ ] Dictée : « je veux courir mon premier marathon d'ici avril » → décomposition en étapes et tâches (`Proposal`)
- [ ] Revue hebdo des objectifs ; liens avec agenda et plan d'entraînement

## Jalon 15 — Habitudes & streaks ⏳
- [ ] `Habit`, streaks, rappels ; première carte dans *Aujourd'hui*
- [ ] Détection automatique quand c'est possible (séance, repas loggés)

## Jalon 16 — Sommeil & énergie v2 ⏳
- [ ] Module sommeil complet (`SleepNight`, tendances, régularité)
- [ ] Score d'énergie transparent (facteurs pondérés, « Pourquoi ? »)
- [ ] Impact sur le plan : adaptation automatique proposée

## Jalon 17 — Productivité ⏳
- [ ] Tâches du jour, minuteur Pomodoro lié aux tâches
- [ ] **« Dicte ta journée »** → l'agent planifie et découpe les tâches autour de l'agenda et des séances

## Jalon 18 — Récompenses (optionnel) ⏳
- [ ] Points gagnés par tâche / séance / repas suivi ; historique
- [ ] Boutique de récompenses personnalisables (**non alimentaires par défaut**, pour ne pas entrer en conflit avec les objectifs nutritionnels)

---

# Phase 3 — Ouverture & plateforme

## Jalon 19 — Ouverture ⏳
- [ ] **Serveur MCP** : exposer l'état et les outils de PulseFit aux assistants (Claude, ChatGPT…)
- [ ] Widgets iOS / Live Activities / Apple Watch (valider une séance, logger un repas)
- [ ] Mode **coach** (B2B2C) : un coach supervise plusieurs athlètes, valide les propositions
- [ ] Multi-tenant, marque blanche, API publique

---

## Décisions ouvertes (à trancher par ADR)
| ADR | Question | Quand |
|---|---|---|
| 002 | Navigation v2 `Accueil · Plan · Agent · Suivi · Stats` — **remplacée par l'ADR-012** | J4 |
| 011 | Styles en `StyleSheet` dérivés des tokens `src/design/`, NativeWind abandonné — ✅ acceptée le 2026-11-04 | Refonte v3.1 |
| 012 | Navigation v3.1 `Aujourd'hui · Semaine · Coach · Progrès`, profil par l'avatar, débrief de course dans le détail d'activité — ✅ acceptée le 2026-11-04 | Refonte v3.1 |
| 013 | Source des activités et éligibilité à l'IA (`source`, `aiEligible`, jamais Strava) — ✅ acceptée le 2026-11-04, **lecture Strava à valider juridiquement** | Refonte v3.1, avant M3 |
| 010 | Sources de données nutrition : Open Food Facts (licence ODbL) + Ciqual + base d'habitudes de l'utilisateur ; recettes générées par l'IA avec valeurs nutritionnelles **recalculées par le code** ; MyFitnessPal : API fermée aux nouveaux partenaires ; FatSecret : offre gratuite limitée à l'anglais / US (vérifier les conditions de chaque source avant adoption) | avant J7 |
| 003 | Backend Supabase (région UE), alternatives | J5 |
| 004 | Sources d'activité autorisées pour l'IA (Strava, Apple Health, Garmin…) | **avant J8** |
| 005 | Modèles par niveau (small / medium / large) après benchmark sur les évals | J6 |
| 006 | Conservation ou suppression des photos d'assiette | J7 |
| 007 | Stockage des données : **local-first** en alpha ; Supabase (UE) + RLS en béta publique ; export Notion / fichiers = option, jamais le socle | Alpha / J5 |
| 008 | Modèle de menaces de l'agent (injection de prompt, secrets, tiers, journaux) — voir « Sécurité » ci-dessous | J6 |

## Risques & garde-fous transverses
- **Légal / données de santé** : RGPD, consentement explicite, minimisation, export / suppression ; avis juridique avant le lancement.
- **Dépendance à une plateforme tierce** : aucune source de données unique pour le coach (cf. ADR-004).
- **Sécurité santé** : plancher calorique, déficit borné selon la charge, verrou 18+, pas d'allégations médicales.
- **Coûts IA** : routage, quotas, dégradation, suivi du coût par utilisateur dès J6.
- **Fiabilité de l'IA** : schémas Zod, validateurs déterministes, évals en CI, confiance affichée.

## Sécurité (ADR-008) — modèle de menaces de l'agent
- **Injection de prompt** : tout contenu externe (nom d'activité, fichier FIT/GPX, texte d'une photo, note importée) est traité comme une donnée non fiable. L'agent n'a **aucun accès direct à la base** (pas de SQL) : uniquement des outils typés. Il ne modifie rien sans `Proposal` validée.
- **Autorisation côté serveur** : l'identifiant utilisateur vient toujours du jeton d'authentification, **jamais du prompt** ni des paramètres fournis par le modèle. Chaque outil vérifie les droits.
- **Secrets** : aucune clé dans l'app ni dans le dépôt ; analyse de secrets en CI ; plafonds de dépense et quotas par utilisateur sur les comptes LLM. **Ne jamais donner de secrets de production à l'agent de dev** (Devin) ; relecture humaine de chaque PR.
- **Tiers (LLM, hébergeur)** : contrats de sous-traitance (DPA), options sans conservation ni entraînement sur les données, résidence des données à vérifier ; envoyer des **résumés agrégés pseudonymisés** (jamais nom, e-mail, identifiants).
- **Journaux** : ne jamais logger le contenu des prompts ni des données de santé ; **scrubbing** dans Sentry et PostHog.
- **Mobile** : jetons dans le stockage sécurisé (Keychain / Keystore), pas dans AsyncStorage ; photos supprimées après analyse par défaut.
- **Chaîne d'approvisionnement** : versions figées (lockfile), mises à jour automatisées et revues, audit des dépendances en CI.
- **Accès** : RLS sur chaque table + tests automatisés des politiques ; test « utilisateur A ne lit jamais les données de B » en CI.

---

## 📓 Journal
| Date | Étape |
|---|---|
| 2026-10-16 | Création du projet Expo + premiers écrans |
| 2026-10-18 | Design épuré / futuriste + mode clair / sombre |
| 2026-10-18 | Navigation à 4 onglets, historique Strava et profil (mock) |
| 2026-10-18 | Monétisation avancée : paywall RevenueCat + essai 7 jours, en parallèle des jalons suivants |
| 2026-10-18 | Nutrition : navigation entre les jours ; états vides & erreurs |
| 2026-10-19 | Nutrition : « Mes recettes » |
| 2026-10-22 | Jalon 2 : calculs nutritionnels, rythme kg/sem, plancher de sécurité, onboarding « Objectif » |
| 2026-10-30 | **Roadmap v2** : architecture modulaire, UX « zéro cliquodrome », Agent Core, gate légal Strava, phase Life OS en modules |
| 2026-10-30 | ADR-002 validé : navigation `Aujourd'hui · Plan · Agent · Suivi · Moi` |
| 2026-10-30 | Jalon 3 démarré : ADR-001 créé, zod + jest-expo ajoutés, branche `jalon-3-socle` |
| 2026-10-30 | T2 — `lib/` → `src/core/`, `src/ui/`, `src/data/mock/` ; upgrade Expo SDK 57→58 |
| 2026-10-30 | T3 — Schémas Zod (10 entités) + 19 tests unitaires |
| 2026-10-30 | T4 — Repositories (4 interfaces) + adaptateurs mock + local |
| 2026-10-30 | T5 — store branché sur les repositories (local seedé + migration de la sauvegarde mvp3) |
| 2026-10-30 | T6 — source unique du bilan du jour (budget = objectif + calories brûlées) |
| 2026-10-30 | T7 — invariant macros : calculateMacros au plancher + setCalorieTarget recalcule P/G/L |
| 2026-10-30 | fix(T5) — filet de sécurité `pf:legacy-mvp3` + `hydrate()` tolérant aux erreurs |
| 2026-10-30 | T8 — `LifeModule` + registre ; Aujourd'hui rendu via les widgets des modules |
| 2026-10-30 | T9 — feature flags par module (`isModuleEnabled` + overrides) |
| 2026-10-30 | T10 — `ProposalCard` + store des propositions (appliquer / éditer / refuser / annuler, toast) |
| 2026-10-30 | J4 — ADR-002, navigation 5 onglets, Suivi par module, CommandBar (MockAgent), carte « Maintenant » ; fix bouton Accueil |
| 2026-10-31 | J4 — maquette v2 : onglet Stats, profil via le prénom, modules activables (Sport / Nutrition / Objectifs / Forme), Plan › Nutrition, accueil nutrition seule |
| 2026-10-31 | J4 — thème « Aurore » (jetons clair/sombre, Inter), barre à pad glissant, `HoldToConfirmCard`, écrans Accueil / Agent / Plan / Suivi / Moi refaits d'après la maquette |
| 2026-10-31 | J4 — rôles et IA : une seule saisie (Agent en 3 zones, exemples par domaine), titres + phrases de rôle, Plan sans zone de texte (« Modifier / Planifier avec l'Agent », écran sans plan), action `create_program` |
| 2026-10-31 | Maquette v2.1 : onglet Moi → Stats, profil via le prénom, sélecteur de modules à icônes, Plan › Nutrition, accueil nutrition seule, Agent en 3 zones, une seule saisie IA (voir `docs/UX-V2-CHANGES.md`) ; roadmap mise à jour (ADR-010) |
| 2026-10-31 | J4 — navigation glissée entre modules (balayage, souligné qui suit le doigt, ressort, `reduced motion`) dans Plan et Suivi |
| 2026-11-01 | **Voie MVP** ajoutée (M1–M6) : moteur d'analyse sur données réelles, coach IA, programmes sans IA, bêta privée de 10–15 testeurs ; sources : analyses Claude « Semi en 1h45 » et « plan MVP » |
| 2026-11-01 | M1 — `src/core/training/types.ts` : schémas Zod `Split`, `DailyMetrics`, `Race`, `AthleteProfile`, `TrainingInsight` ; `Activity` et `Insight` réutilisés de J3 |
| 2026-11-01 | M1 — ADR-004 rédigée + `scripts/import-strava.ts` (zip → `activities.csv` FR → FIT → snapshot gitignoré) ; parseurs réutilisables dans `src/core/training/import/` |
| 2026-11-01 | M1 — import réussi sur l'export réel : 166 activités, 138 FIT + 28 GPX lus, 137 sorties avec splits (les 29 restantes sont des musculation sans distance), 30 sans FC ; valeurs de référence confirmées (Paris 2024 1h48:16, Reims 2025 1h50:50) |
| 2026-11-01 | M1 — `src/core/training/engine/` : volume hebdo/mensuel, régularité et coupures, zones de FC configurables, intensités, efficacité aérobie trimestrielle, détection courses + débrief (tranches, dérive, recalage officiel), prépa 8 semaines ; 9 courses détectées sur l'export réel dont les 3 semis ; « Course à pied » (titre auto Strava) exclu de la détection par nom |
| 2026-11-01 | M1 — moteur affiné sur données réelles : `detectRaces` → candidates (confidence + reasons, confirmed/rejectedIds), prépa en 8 fenêtres glissantes de 7 j (complete, coveredDays), recalage sur `traceDistanceKm` (distance brute GPS/FIT ≠ CSV), moitiés avec split frontière partagé, EF trimestrielle = médiane par sortie (ratio Q2-26/Q1-24 ≈ 0,92) |
| 2026-11-01 | M1 — `src/core/training/insights/` : 8 règles pures (data_quality_no_hr, intensity_too_high, race_pacing, race_prep, gap_resume, volume_ramp, consistency, aerobic_trend), `evaluateInsights` / `rankInsights`, textes FR débutant / sportif + lint, catalogue `docs/insights-catalog.md` |
| 2026-11-01 | M1 — insights, passe de relecture : `confirm_race` (courses confirmées / déclarées uniquement pour pacing et bilan de prépa), source `trend` partout sauf `gap_resume`, conseils relatifs (reprise 70 %, sortie longue +10 %/sem., FC max effective et « environ »), prépa courte / dernière ligne droite, `consistency` masquée après une coupure, `mutedRuleIds` (rejet = 4 semaines) ; catalogue mis à jour |
| 2026-11-01 | M2 — navigation & perf : `src/ui/nav.ts` (`openActivity`/`openRace`, verrou anti-rebond 1 s — 3 taps = 1 page), `src/ui/sportDerived.ts` (mapping + courses + index des comparables calculés une fois par version du snapshot ; débrief et moment fort mémoïsés), carte/courbes différées après transition (`requestIdleCallback`, InteractionManager retiré de RN 0.88) ; bench snapshot réel : 1,35 ms → 0,04 ms par ouverture |
| 2026-11-01 | M1 — insights : carte « dernière ligne droite » pour toute course confirmée/déclarée à ≤ 10 j (indépendante de la prépa), `confirm_race` jamais masquée (refus = `rejectedIds`), allure visée de `targetTime` validée (2:30–10:00/km, ambiguïtés tranchées par la distance) |
| 2026-11-01 | M1 — insights : `parseTargetTime(value, distanceKm)` garde les lectures h:mm / mm:ss dont l'allure est plausible (seuil 15 km supprimé) ; toute carte sur une course précise exige une course déclarée ou confirmée (y compris `race_prep` à venir) |
| 2026-11-01 | M1 — insights : `data_quality_no_hr` jamais pour un débutant ni sans appareil FC (`AthleteProfile.hasHrDevice`, aussi pour `intensity_too_high` et `aerobic_trend`), ≥ 5 séances avec FC exigées, texte « montre ou capteur cardiaque », refus permanent via `rankInsights({ rejectedForever })` |
| 2026-11-01 | M2 — adaptateur `fixture` : `EXPO_PUBLIC_USE_FIXTURE=1` sert `fixtures/julien.snapshot.json` via `FixtureActivityRepository` (repos locaux pour le reste) ; `IActivityRepository.listAll()`, hydrate charge tout l'historique ; `ActivityType` étendu (swim / strength / other affichés tels quels) ; `seed.ts` n'injecte plus les mocks dans le dépôt fixture ; `metro.config.js` → snapshot vide si le fichier est absent ; `.env.local` activé, `.env.example` documenté |
| 2026-11-01 | fix(M2) — détail activité sur données réelles : `RouteMap`/`SplitsList`/`HeartRateChart` tolèrent l'absence de trace GPS / splits / flux FC (le snapshot n'en contient pas) ; sections masquées si vides, héro en durée pour les sorties sans distance (muscu) |
| 2026-11-01 | fix(M2) étape 1 — `movingTimeSec` (CSV « Temps de déplacement » + FIT) : allure/vitesse sur le temps en mouvement, temps officiel des courses inchangé (écoulé), EF aérobie sur le mouvement ; `src/core/sportFormat.ts` (run/walk→min/km, ride→km/h, swim→/100 m, formats FR virgule/jour/heure) ; titres auto Strava EN→FR à l'affichage ; `StravaActivity` optionnel — plus de 0 pour valeur absente |
| 2026-11-01 | M2 — `startCity` : ville de départ des courses uniquement (1er point GPS GPX/FIT → ville la plus proche de `cities-fr.ts`, GeoNames cities1000 FR ; aucune coordonnée stockée, exclu de `AthleteSummary` — amendement ADR-004) ; ligne « À confirmer » enrichie (date · heure · ville · distance · chrono) ; nom suggéré « Semi-marathon de Reims 2024 » |
| 2026-11-04 | Direction v3.1 — socle : `src/design/` (`theme.ts` + `fontScaleCaps` / `fontScaleBreakpoints` / `heroMinimumFontScale` dans `Theme`, `useTheme` système, `makeStyles`), polices Inter 400/600 + Inter Tight 600/700 sous écran de démarrage, ADR-011 (StyleSheet dérivés des tokens, NativeWind gelé), règles ESLint `pulsefit/no-literal-style` et `pulsefit/no-classname` avec exceptions temporaires par étape ; aucun écran modifié |
| 2026-11-04 | Refonte v3.1 — préparation (documentation seule) : tag `pre-v3` poussé ; ADR-012 (navigation `Aujourd'hui · Semaine · Coach · Progrès`, profil par l'avatar, débrief de course dans le détail d'activité) remplace l'ADR-002 ; ADR-013 (source des activités, `aiEligible`, jamais Strava vers l'IA) ; bêta limitée au sport ; AGENTS.md, `.windsurfrules` et ROADMAP mis à jour ; `docs/theme.js` et l'artefact `.claude/worktrees/` retirés |
| 2026-11-04 | ADR-013 complétée : séances écrites par l'app Strava via Apple Santé / Health Connect (bundle id / package d'origine) → source `strava` ; `device` = `manufacturer` de `file_id` FIT ; échelle de ressenti unique `easy | moderate | hard` (« Facile · Correct · Dur ») ; constat : aucune règle de prédiction de semi dans `thresholds.ts` |
| 2026-11-04 | Refonte v3.1, étape 2 — coquille de navigation (ADR-012) : 4 onglets et TabBar v3.1 (`size.tabBar`), écrans provisoires, Stack `profile/` ouvert par l'avatar, `(dev)/gallery`, `/agent` → `/coach` ; routes plan, suivi, stats, activities, race, scan, preview-stats supprimées ; interface nutrition, scan, Forme, ModuleSwitcher/ModuleTabs retirée ; registre `week` / `progress`, nutrition, goals et wellness désactivés par défaut ; liens de course → `/activity/<id>` ; tests 633 → 602 (−33 exceptions ESLint retirées, +3 registre, −1 nav) ; vérification sur appareil restant à faire |
| 2026-11-04 | Refonte v3.1, étape 3 — composants SPEC-v3 : `EffortPill` · `HeroMetric` · `CoachCard` · `SessionCard` · `ProposalCard` · `EmptyState` · `UndoToast` · `useDelayedSkeleton` ; galerie de dev ; `'ok'` → `'moderate'` partout (EffortPill, gallery, SPEC-v3, ADR-013) |
| 2026-11-04 | Refonte v3.1, étape 4 — `groupSessions` et source des activités (ADR-013) : `ActivitySchema.source` requis (enum 8 valeurs), `aiEligible` requis, `device` optionnel ; `dedupeActivities` (priorité par source, départage par données) ; `aiEligibleView` ; `sourceFromHealthKit` (liste blanche bundle ids) ; `groupSessions` (règle v1 : même sport, ≤ 15 min, même jour, ≤ 4 h, chaîné, overrides split/merge/role, neverGroup) ; `resolveSession` ; `scripts/check-sessions.ts` ; ADR-013 amendée (liste blanche HealthKit, priorités, copie Strava) ; SPEC-v3 complétée (overrides, identifiant stable) |

| 2026-11-08 | Refonte v3.1, étape 5 — écran Coach : `src/screens/coach/` (conversation, `coachEngine`, `coachFlow`, bandeau Annuler), `Composer`, `UserBubble`, `Chip` ; accord IA `aiConsent` (faux par défaut) ; repli moteur annoncé ; question obligatoire et jours indisponibles ; CommandBar, `proposals/*`, Rise, ScreenTitle retirés (−5 exceptions ESLint) ; tests 760 → 796 |
| 2026-11-08 | Documentation alignée sur les maquettes v3.4 (`docs/maquettes/v3.4/`) : ROADMAP (description de la bêta, principes, tâches d'écrans et d'onboarding), SPEC-v3 (direction, niveau déclaré, deux échelles d'effort, composants mis à jour et complémentaires, section « Écrans »), amendement **proposé** de l'ADR-012 (détail, semaine passée et débrief dans l'onglet, débrief à part, profil en modale, onboarding en 4 questions), AGENTS.md, `.windsurfrules` ; écarts dans `docs/questions.md` ; aucun code modifié |
| 2026-11-08 | Décision : « tout faire comme les écrans des maquettes ». Amendement v3.4 de l'ADR-012 accepté ; Q1 à Q6 répondues dans le sens des captures (débrief ouvert depuis Tes semis, pas de source sur le détail sauf texte IA, « — » permis dans les graphiques, onboarding sans âge ni jours, séance prévue non touchable dans Semaine) ; SPEC-v3, AGENTS.md et `.windsurfrules` mis à jour |
| 2026-11-08 | Refonte v3.1, étape 5 — routes de l'amendement v3.4 (ADR-012) : piles par onglet `(tabs)/(semaine,progres)/` (routes partagées), `activity/[id]` et `activity/[id]/debrief` empilés dans l'onglet (barre visible), `(semaine)/week/[start]` ; débrief et semaine passée en écrans provisoires avec retour (« ‹ Semi de Reims », « ‹ Cette semaine ») ; détail déplacé dans `src/screens/activity/ActivityScreen.tsx` (+ `useResolvedSession`) ; profil présenté en modale avec « Fermer » ; `openActivity(id, tab)`, `openWeek`, `openDebrief` ; test de navigation `renderRouter` (`standard-navigation` ajouté à `transformIgnorePatterns`) ; vérification sur appareil restant à faire |

## ▶️ Prochaine étape

**Refonte v3.1, étape 5 : écrans** exactement comme `docs/maquettes/v3.4/`, sur la branche `refonte` : niveau déclaré dans `src/core/`, écarts des composants et composants complémentaires, puis les écrans dans l'ordre de la section Refonte.

En parallèle (hors code) : faire valider juridiquement la lecture des conditions Strava (ADR-013) avant M6 ; maquetter Réglages, Modules et l'historique du Coach.
