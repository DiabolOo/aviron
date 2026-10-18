# 🗺️ PulseFit — Feuille de route

> Objectif final : un **Life OS** tout-en-un (sport + nutrition + objectifs perso).
> Stratégie : livrer d'abord le **MVP Sport + Nutrition (Option A)**, puis ajouter la
> **gamification / productivité (Option B)**.

## Comment utiliser ce fichier
- Cocher `[x]` chaque sous-tâche terminée, et passer le statut du jalon à ✅ quand tout est coché.
- Un jalon = un ensemble livrable et testable sur téléphone. On n'ouvre pas le suivant tant que
  le précédent n'est pas utilisable. **Exception** : le **Jalon 6 (monétisation)** démarre dès que
  les jalons 4 + 5 sont livrés, et se développe **en parallèle** des jalons 7–9 — l'app apporte
  déjà assez de valeur pour être payante, les premiers abonnés financent la suite.
- Ajouter une ligne dans le **Journal** en bas à chaque étape importante. Ça motive de voir le chemin parcouru 💪
- Statuts : ✅ terminé · 🚧 en cours · ⏳ à venir

## Vue d'ensemble

| # | Jalon | Statut |
|---|---|---|
| 0 | Fondations techniques | ✅ |
| 1 | UI du MVP en données mockées (4 onglets) | 🚧 |
| 2 | Onboarding & calculs nutritionnels (local) | ⏳ |
| 3 | Backend & comptes utilisateurs | ⏳ |
| 4 | Scan d'assiette IA réel | ⏳ |
| 5 | Intégration Strava | ⏳ |
| 6 | Monétisation : paywall & essai 7 jours | ⏳ |
| 7 | Planification des séances | ⏳ |
| 8 | Objectifs de courses (catalogue) | ⏳ |
| 9 | Recommandations de recettes | ⏳ |
| 10 | Qualité & lancement | ⏳ |
| 11+ | Phase 2 — Life OS (gamification & productivité) | ⏳ |

---

## Phase 1 — MVP Sport + Nutrition

### Jalon 0 — Fondations techniques ✅
- [x] Projet Expo SDK 57 + Expo Router + TypeScript strict
- [x] NativeWind (Tailwind) + design system (tokens sémantiques)
- [x] Store Zustand persisté (AsyncStorage)
- [x] Données mockées (profil, séances, repas)
- [x] Lint (ESLint expo) + typecheck
- [x] Dépôt GitHub (`main`)

### Jalon 1 — UI du MVP en données mockées 🚧
**Navigation & design**
- [x] Bottom nav à 4 onglets : Aujourd'hui · Sport · Nutrition · Profil
- [x] Design épuré / futuriste, mode clair + sombre (auto / manuel)
- [x] Composants UI partagés (Card, Label, Segmented, Stepper, ProgressRing…)

**🏠 Aujourd'hui**
- [x] Météo + statut du jour (mock)
- [x] Jauge calories : mangées / brûlées / objectif / restantes
- [x] Séance prévue + validation en un tap

**🏋️ Sport**
- [x] Programme en cours + calendrier de la semaine
- [x] Détail de séance (blocs course / exercices muscu)
- [x] Historique des activités Strava (mock)
- [x] Adaptation de la semaine selon forme / temps (IA mockée)
- [x] Écran détail d'une activité Strava (carte, splits, FC)

**🥗 Nutrition**
- [x] Bouton scan rapide → modal plein écran
- [x] Scan d'assiette : caméra / galerie → analyse → résultat (IA mockée)
- [x] Apports du jour + macros (protéines / glucides / lipides)
- [x] Journal par moment (matin / midi / collation / soir)
- [x] Modifier / supprimer un repas
- [ ] Ajout manuel d'un repas (sans photo)
- [ ] Naviguer entre les jours (hier, avant-hier…)

**👤 Profil**
- [x] Objectifs poids actuel / cible + calories par jour
- [x] Connexions Strava / montre (bascule mock)
- [x] Choix du thème
- [ ] Modifier le prénom et l'objectif sportif

**Finition**
- [ ] États vides et états d'erreur sur chaque écran
- [ ] Test complet sur iPhone et Android (Expo Go)

### Jalon 2 — Onboarding & calculs nutritionnels (local) ⏳
- [ ] Parcours d'onboarding (3–5 écrans) : prénom, sexe, âge, taille, poids, niveau d'activité
- [ ] Choix de l'objectif : perte / maintien / prise de masse + objectif sportif
- [ ] Calcul du métabolisme de base (Mifflin-St Jeor) et de la dépense journalière (TDEE)
- [ ] Calcul automatique de l'objectif calorique et de la répartition des macros
- [ ] Recalcul quand le poids ou l'objectif change dans Profil
- [ ] Afficher l'onboarding seulement au premier lancement
- [ ] Tests unitaires des fonctions de calcul (`lib/`)

### Jalon 3 — Backend & comptes utilisateurs ⏳
- [ ] Choisir le backend (recommandé : Supabase = Auth + Postgres + Storage + Edge Functions)
- [ ] Créer le projet + variables d'environnement (`EXPO_PUBLIC_…` uniquement pour les clés publiques)
- [ ] Authentification : email magique + Sign in with Apple + Google
- [ ] Schéma de base : `profiles`, `meals`, `sessions`, `activities`, `goals`
- [ ] Sécurité : Row Level Security (chaque utilisateur ne voit que ses données)
- [ ] Synchronisation store local ↔ backend (mode hors-ligne conservé)
- [ ] Suppression de compte + export des données (RGPD)

### Jalon 4 — Scan d'assiette IA réel ⏳
- [ ] Edge Function « analyse d'assiette » (clé IA côté serveur, **jamais dans l'app**)
- [ ] Upload de la photo (compressée) vers le stockage
- [ ] Prompt vision avec réponse JSON structurée (plat, aliments, portions, kcal, macros, confiance)
- [ ] Écran de correction : ajuster les portions et aliments avant d'enregistrer
- [ ] Repli si confiance faible : recherche manuelle dans une base d'aliments (Open Food Facts)
- [ ] Scan de code-barres (expo-camera) pour les produits emballés
- [ ] Quotas et suivi des coûts d'appels IA par utilisateur

### Jalon 5 — Intégration Strava ⏳
- [ ] Créer l'application sur l'API Strava (nom, logo, URL de redirection)
- [ ] Connexion OAuth (expo-auth-session + deep link `pulsefit://`)
- [ ] Échange et rafraîchissement des tokens côté serveur (Edge Function)
- [ ] Import des activités des 30 derniers jours
- [ ] Webhook Strava pour recevoir les nouvelles activités automatiquement
- [ ] Calories brûlées réelles → jauge de l'onglet Aujourd'hui
- [ ] Analyse : volume hebdo, allure moyenne, évolution sur 4 semaines
- [ ] Validation automatique d'une séance prévue quand une activité correspondante arrive

### Jalon 6 — Monétisation : paywall & essai 7 jours ⏳
> **À activer dès que les jalons 4 + 5 sont livrés**, sans attendre les jalons 7–9 : scan IA réel +
> synchro Strava suffisent à justifier un abonnement. Les premiers clients payants peuvent signer
> pendant que la suite de la roadmap est développée.
- [ ] Choisir le provider : **RevenueCat** (`react-native-purchases`) pour l'in-app iOS/Android —
      Stripe seulement si une version web arrive un jour
- [ ] Créer les produits dans App Store Connect / Play Console : mensuel + annuel, **essai 7 jours**
- [ ] Config RevenueCat : clés publiques, entitlement `premium` (build EAS requis, pas Expo Go)
- [ ] Écran paywall dans le design system : une promesse, 2 offres (mensuel / annuel mis en avant),
      CTA accent + restauration des achats
- [ ] Gating premium : scan illimité, plans IA, stats avancées — gratuit : jauge calories,
      journal basique, historique
- [ ] Afficher le paywall en fin d'onboarding et à l'expiration de l'essai (pas à froid au 1er lancement)
- [ ] Profil : statut d'abonnement + lien « Gérer mon abonnement »
- [ ] Liens CGU + politique de confidentialité dans le paywall (obligatoire App Store / Play)
- [ ] Mesurer : taux de conversion essai → payant, revenu mensuel récurrent

### Jalon 7 — Planification des séances ⏳
- [ ] Modèles de plans (10 km, semi, marathon, renforcement) par niveau
- [ ] Génération du plan selon l'objectif, le niveau et les jours disponibles
- [ ] Éditeur : ajouter / modifier / déplacer une séance (glisser-déposer dans la semaine)
- [ ] Adaptation IA réelle (fatigue, temps dispo, séances manquées)
- [ ] Rappels de séance (expo-notifications)
- [ ] Vue mois / vue plan complet

### Jalon 8 — Objectifs de courses (catalogue) ⏳
- [ ] Catalogue de courses v1 (fichier JSON : nom, date, ville, distance, dénivelé)
- [ ] Recherche et filtres (distance, date, région)
- [ ] Ajouter une course comme objectif (temps visé)
- [ ] Compte à rebours sur l'onglet Aujourd'hui
- [ ] Plan d'entraînement généré à rebours depuis la date de course
- [ ] Prédiction du temps final à partir des activités Strava (formule de Riegel)
- [ ] Catalogue v2 : source de données externe mise à jour automatiquement

### Jalon 9 — Recommandations de recettes ⏳
- [ ] Base de recettes (kcal, macros, temps de préparation, tags)
- [ ] Suggestions selon les calories et macros restantes du jour
- [ ] Filtres : végétarien, rapide, riche en protéines, avant / après séance
- [ ] Favoris
- [ ] Ajouter une recette au journal en un tap

### Jalon 10 — Qualité & lancement ⏳
- [ ] Tests (jest-expo) sur la logique métier + parcours critiques
- [ ] Suivi des erreurs (Sentry) et analytics produit (ex. PostHog)
- [ ] Profils EAS Build : development / preview / production
- [ ] Bêta : TestFlight (iOS) + test interne Play Store (Android)
- [ ] Itérer sur le paywall selon les retours bêta (prix, offres, wording)
- [ ] Mentions légales, politique de confidentialité (données de santé), CGU
- [ ] Fiches stores : captures, description, icône finale
- [ ] Mises à jour OTA (EAS Update)
- [ ] 🚀 Publication v1.0

---

## Phase 2 — Life OS (gamification & productivité) ⏳

> À démarrer une fois la v1.0 publiée. Ces briques se branchent sur **Aujourd'hui** (widgets)
> et **Profil** (hub), sans ajouter d'onglet.

### Jalon 11 — Objectifs & habitudes
- [ ] Objectifs journaliers (tâches du jour)
- [ ] Objectifs long terme découpés en étapes
- [ ] Suivi de streaks pour ancrer une nouvelle habitude

### Jalon 12 — Points & boutique de récompenses
- [ ] Points gagnés à chaque tâche / séance / repas suivi
- [ ] Boutique de récompenses personnalisables (sieste, cheat meal…)
- [ ] Historique des gains et des achats

### Jalon 13 — Énergie & statistiques
- [ ] Barre d'énergie journalière (sommeil, charge d'entraînement, nutrition)
- [ ] Statistiques personnalisées (tableaux de bord)

### Jalon 14 — Productivité
- [ ] Minuteur Pomodoro intégré aux tâches
- [ ] Description vocale de la journée → l'IA planifie et découpe les tâches

---

## 📓 Journal
| Date | Étape |
|---|---|
| 2026-10-16 | Création du projet Expo + premiers écrans |
| 2026-10-18 | Design épuré / futuriste + mode clair / sombre |
| 2026-10-18 | Navigation à 4 onglets (Aujourd'hui · Sport · Nutrition · Profil), historique Strava et profil (mock) |
| 2026-10-18 | Monétisation avancée : nouveau Jalon 6 (paywall RevenueCat + essai 7 jours) activé dès les jalons 4 + 5, en parallèle des jalons 7–9 |

## ▶️ Prochaine étape conseillée
Terminer le **Jalon 1** (modifier / supprimer un repas, ajout manuel, états vides), puis
attaquer le **Jalon 2** : l'onboarding rend l'app utilisable par quelqu'un d'autre que toi.
