# 🗺️ PulseFit — Feuille de route v2 (agent-first & modulaire)

> **Objectif final** : un **Life OS** (sport, nutrition, sommeil, agenda, objectifs, habitudes) piloté par des agents.
> **Principe** : l'utilisateur exprime une *intention* (texte ou voix), les agents préparent, l'utilisateur **valide en 1 tap**.
> **MVP (v1.0)** : « Coach endurance IA » = plan d'entraînement généré par intention + brief quotidien + nutrition adaptée + scan d'assiette.
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
3. **Une entrée universelle** : la barre de commande (texte ou dictée) accepte toute intention.
4. **Budget de taps** : valider une séance ≤ 1 · logger un repas habituel ≤ 2 · logger par photo ≤ 3 · planifier une semaine = 1 phrase.
5. **Chaque écran répond à « que dois-je faire maintenant ? »** avant de montrer des chiffres.
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
  ui/          # design system (tokens, Card, Label, ProposalCard, CommandBar…)
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
  dashboards: Dashboard[];         // écrans du « Suivi »
  agentTools: AgentTool[];         // outils que l'agent peut appeler (lecture libre, écriture via Proposal)
  analyzers: Analyzer[];           // jobs quotidiens / hebdo qui produisent des Insights
}
```

**Objets transverses** : `Proposal` (action proposée : `pending | accepted | edited | rejected | undone`, avec `rationale` et `confidence`), `Insight` (constat/conseil), `DailyBrief`, `AgentRun` (modèle, tokens, coût, latence), `Consent`.

**Navigation cible (à valider, ADR-002)** : `Aujourd'hui · Plan · ⊕ Agent · Suivi · Moi`.
Les modules s'ajoutent dans *Aujourd'hui* (cartes), *Plan* (événements), *Suivi* (sélecteur de module) et *Agent* (outils), sans créer d'onglet.

## Vue d'ensemble

| # | Jalon | Statut |
|---|---|---|
| 0 | Fondations techniques | ✅ |
| 1 | UI v1 en données mockées (4 onglets) | ✅ |
| 2 | Onboarding & calculs nutritionnels (local) | ✅ |
| 3 | Socle modulaire & contrats de données | ⏳ |
| 4 | UX v2 « zéro cliquodrome » (sur mocks) | ⏳ |
| 5 | Backend, comptes & conformité de base | ⏳ |
| 6 | Agent Core (passerelle LLM, propositions, évals) | ⏳ |
| 7 | Nutrition IA réelle (photo, langage naturel, code-barres) | ⏳ |
| 8 | Données d'activité & santé réelles (providers) | ⚠️ |
| 9 | Coach IA : plan par intention, adaptation, brief, revue | ⏳ |
| 10 | Nutrition périodisée & recettes | ⏳ |
| 11 | Monétisation : paywall & essai 7 jours | ⏳ |
| 12 | Qualité, béta & lancement v1.0 | ⏳ |
| 13 | Planning & agenda | ⏳ |
| 14 | Objectifs court / long terme | ⏳ |
| 15 | Habitudes & streaks | ⏳ |
| 16 | Sommeil & énergie v2 | ⏳ |
| 17 | Productivité (tâches, Pomodoro, dictée de journée) | ⏳ |
| 18 | Récompenses (optionnel) | ⏳ |
| 19 | Ouverture : MCP, API, widgets, mode coach | ⏳ |

**Correspondance avec l'ancienne roadmap** : ancien J3 → J5 · J4 → J7 · J5 → J8 · J6 → J11 · J7 → J9 · J8 → J9 (objectif de course) · J9 → J10 · J10 → J12 · J11 → J14/J15 · J12 → J18 · J13 → J16 · J14 → J17.

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
| A2 | UX v2 : nouvelle navigation, CommandBar (agent mock), flux Aujourd'hui | J4 |
| A3 | Proxy IA, sorties structurées validées, journal de coût | J6 (version minimale) |
| A4 | Scan d'assiette + saisie en langage naturel | J7 |
| A5 | Import FIT COROS + Apple Health + calcul de charge | J8 (sans Strava) |
| A6 | Coach : plan par intention, adaptation quotidienne, brief généré à l'ouverture de l'app | J9 |
| A7 | Usage quotidien pendant 2 semaines + journal des frictions | — |

- **Critère de sortie** : tu l'utilises tous les jours pendant 2 semaines sans ouvrir une autre app pour le sport et la nutrition.
- **Volontairement reporté** : comptes, Supabase, RGPD, paywall, Strava, brief par cron serveur (donc pas de brief automatique à heure fixe), multi-appareils.
- **Passage à la béta publique** : reprendre les jalons J5 (backend UE + RLS + consentement), J6 complet, J8 complet, J11, J12.

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

## Jalon 3 — Socle modulaire & contrats de données ⏳
> Pourquoi maintenant : l'UI est construite sur des mocks. Fixer les contrats avant d'ajouter des écrans évite de tout reprendre au backend.
- [x] ADR-001 : architecture modulaire (`core / modules / agent / data / ui`)
- [x] Réorganiser le dépôt selon l'arborescence cible (déplacer `lib/` vers `src/core/`, sans changer le comportement)
- [x] Schémas Zod : `Profile`, `Meal`, `FoodItem`, `PlannedWorkout`, `Activity`, `TrainingPlan`, `Goal`, `Insight`, `Proposal`, `DailyBrief`
- [x] Interfaces de repositories + adaptateur **mock** + adaptateur **local** ; l'UI n'importe plus les mocks
- [x] `LifeModule` + registre de modules ; migrer Sport, Nutrition et Profil comme premiers modules
- [ ] Composant `ProposalCard` + store des propositions (Valider / Modifier / Refuser / Annuler)
- [x] **Source unique du bilan du jour** : sélecteur `getDailyBalance(date)` utilisé par *Aujourd'hui* et *Nutrition* (corriger l'écart actuel : 2250 kcal restantes vs objectif 2270 affiché)
- [x] Test d'invariant : la somme kcal des macros (P×4 + G×4 + L×9) = objectif ±1 % (aujourd'hui 140 P / 255 G / 63 L → 2147 kcal pour 2270)
- [x] Feature flags par module
- **DoD** : l'app tourne à l'identique avec la nouvelle structure ; ajouter un module factice « test » ne demande aucune modification de la navigation.

## Jalon 4 — UX v2 « zéro cliquodrome » ⏳
> Refonte ergonomique sur les mocks, avant de brancher la vraie IA.
- [ ] ADR-002 : acter la navigation **validée** `Aujourd'hui · Plan · Agent · Suivi · Moi` (les onglets Sport et Nutrition disparaissent ; leurs écrans migrent dans *Suivi* via un sélecteur de module, la saisie passe par *Aujourd'hui* et la CommandBar)
- [ ] **CommandBar** : champ texte + dictée vocale ; au début, `MockAgent` qui renvoie des `Proposal` conformes au schéma
- [ ] **Aujourd'hui = flux d'actions** : carte « Maintenant » (prochaine action) → bilan kcal → séance du jour validable en 1 tap → propositions en attente → brief IA (placeholder)
- [ ] Supprimer les doublons d'affichage (macros en-tête vs carte « Apports du jour » dans Nutrition)
- [ ] Remplacer le formulaire « Forme / Temps max / Régénérer » par : valeurs **inférées** + phrase libre dans la CommandBar (« claqué, 45 min max ») ; garder des chips rapides facultatives
- [ ] Saisie repas : appareil photo direct (appui long sur le bouton scan), **repas habituels suggérés selon l'heure** (1 tap), « comme hier », saisie en langage naturel
- [ ] Séance du jour : validation automatique quand l'activité correspondante arrive (prévoir l'UI d'annulation)
- [ ] Détail d'activité : emplacement « Analyse IA » (3 constats + 1 conseil, placeholder)
- [ ] Barre d'énergie : afficher le « Pourquoi ? » (facteurs et poids)
- [ ] Charte des zones tactiles et d'accessibilité (taille mini, contraste, Dynamic Type) ; s'assurer qu'aucun bouton d'action n'est collé aux bords (le bouton d'outils de dev Expo masque aujourd'hui le CTA de la carte séance)
- [ ] **Tableau du budget de taps** par parcours clé (voir principes) validé sur device
- **DoD** : les parcours clés respectent le budget de taps ; aucun formulaire à plus de 2 champs ; une même donnée n'apparaît qu'une fois par écran.

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
> Chaque jalon = un module qui s'enregistre via `LifeModule` : cartes dans *Aujourd'hui*, événements dans *Plan*, dashboards dans *Suivi*, outils pour l'agent, analyseurs quotidiens / hebdo. **Aucun nouvel onglet.**

## Jalon 13 — Planning & agenda ⏳
- [ ] Entité `CalendarEvent`, vue *Plan* (semaine / mois)
- [ ] Import du calendrier en lecture seule (Apple / Google)
- [ ] **Time-blocking par l'agent** : « place mes 4 séances autour de mon agenda » → `Proposal`
- [ ] Détection de conflits ; disponibilités injectées dans le coach (J9)

## Jalon 14 — Objectifs court / long terme ⏳
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
| 002 | Navigation `Aujourd'hui · Plan · Agent · Suivi · Moi` — ✅ **validée le 2026-10-30** | J4 |
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

## ▶️ Prochaine étape
Lancer le **Jalon 3** (socle modulaire & contrats de données), en commençant par l'ADR-001 et la source unique du bilan du jour.
En parallèle (hors code) : lire l'accord API Strava complet et ouvrir l'**ADR-004** avant de démarrer le Jalon 8.
