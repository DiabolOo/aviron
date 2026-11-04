# AGENTS.md — PulseFit

> Instructions pour tous les agents de code (Claude Code, Devin Desktop / Cascade…).
> Source de vérité du plan : `ROADMAP.md` (jalons, DoD, ADR). **Lis-le avant toute tâche.**

## Projet
PulseFit est une app mobile « agent-first » : l'utilisateur exprime une intention (texte ou voix), les agents préparent, il valide en 1 tap. Vision : un Life OS (sport, nutrition, puis agenda, objectifs, habitudes).
Stack : Expo SDK 58, Expo Router, TypeScript strict, Zustand ; styles en `StyleSheet` dérivés des tokens de `src/design/`, **sans NativeWind** (ADR-011). Backend prévu : Supabase (UE) — pas avant le jalon 5.

## Refonte v3.1 (branche `refonte`, état de départ : tag `pre-v3`)
- **Navigation : 4 onglets** `Aujourd'hui · Semaine · Coach · Progrès`, profil dans un Stack hors onglets ouvert par l'avatar (ADR-012). Jamais de 5e onglet.
- **Bêta limitée au sport.** Nutrition, scan d'assiette, module Objectifs et Forme : interface supprimée (récupérable depuis `pre-v3`) ; la couche données (`src/data`, store) reste et les modules sont désactivés par défaut.
- **Ordre de la refonte** : (1) coquille de navigation → (2) composants de `docs/SPEC-v3.md` → (3) `groupSessions` et source des activités (ADR-013) dans `src/core/` → (4) les écrans. Ne pas commencer une étape avant la fin de la précédente.
- Spécification des composants : `docs/SPEC-v3.md`. Tokens : `src/design/theme.ts`.

## Commandes
- `npm run typecheck` · `npm run lint` · `npm test` — **les trois doivent passer avant chaque commit.**
- `npx expo start` — lancer l'app en développement.

## Architecture (cible, voir ROADMAP.md)
```
src/core/     domaine pur testé (nutrition, charge d'entraînement, validation de plans) — sans React ni réseau
src/modules/  un dossier par module de vie (sport, nutrition, profile…), chacun avec un manifeste `LifeModule`
src/agent/    client de la passerelle LLM, routeur de modèles, prompts versionnés, outils
src/data/     repositories (interfaces) + adaptateurs mock / local / Supabase
src/design/   tokens v3.1 (theme.ts), useTheme, makeStyles, polices — seule source de valeurs de style
src/ui/       composants partagés (CoachCard, HeroMetric, SessionCard, ProposalCard…) et hooks d'UI
app/          routes Expo Router (fines : elles assemblent les modules) — structure dans ADR-012
evals/        jeux de cas pour mesurer les sorties d'IA
docs/adr/     décisions d'architecture
```

## Règles non négociables
1. **Logique déterministe dans `src/core/`**, testée. Jamais de calcul nutritionnel ou de charge dans un composant.
2. **Toute sortie d'IA est validée par un schéma Zod** avant usage ; sinon 1 retry puis repli propre.
3. **L'IA ne modifie jamais les données directement** : elle crée une `Proposal` validée par l'utilisateur (sauf actions à faible risque marquées `autoApply`, avec bouton Annuler).
4. **L'UI n'importe jamais les mocks** : elle passe par les repositories de `src/data/`.
5. **Aucune clé secrète dans l'app ni dans le dépôt.** Seules les variables `EXPO_PUBLIC_…` publiques. Tout appel LLM passe par la passerelle serveur.
6. Ne jamais envoyer à un LLM plus de données que nécessaire : résumés agrégés, jamais nom, e-mail ni identifiants.
7. Ne jamais logger le contenu des prompts ni des données de santé.
8. Une donnée = un endroit : pas d'information affichée deux fois sur le même écran. Tout score ou conseil est explicable (« Pourquoi ? »).
9. **Source d'activité pour l'IA (ADR-013)** : chaque activité porte `source` et `aiEligible` (toujours faux pour `strava`). Le résumé envoyé à l'IA exclut toute activité non éligible, y compris de ses agrégats. L'analyse sur le téléphone n'est pas concernée. Seuls les textes réellement rédigés par l'IA portent « Rédigé par l'IA ».

## Méthode de travail
- Un jalon = une branche `jalon-N-nom`. Une tâche = un commit petit et relisible.
- Dans le même commit : cocher la tâche dans `ROADMAP.md` et ajouter une ligne au Journal.
- Ne démarre jamais un jalon qui n'a pas été demandé. Ne modifie pas les jalons non démarrés.
- **Si tu es bloqué ou face à une décision** : écris la question dans `docs/questions.md` (format dans `docs/AGENT-WORKFLOW.md`) et passe à la tâche indépendante suivante. Ne devine jamais sur : secrets, choix légal, dépenses, suppression de données, décision d'architecture (→ ADR).
- Fin de jalon : vérifie la DoD, puis écris le résumé de revue (modèle dans `docs/AGENT-WORKFLOW.md`).

## Style
- TypeScript strict, pas de `any`, composants fonctionnels.
- Tokens du design system uniquement (aucune couleur en dur) : styles via `makeStyles` / `useTheme` de `src/design/`, jamais `className` (NativeWind abandonné, ADR-011). Garde-fou : `pulsefit/no-literal-style` et `pulsefit/no-classname` ; ne jamais ajouter de ligne à `eslint-rules/legacy-exceptions.js`, en retirer une par fichier migré.
- Textes d'interface en français ; noms de code en anglais.
- Tests à côté du code (`*.test.ts`).

## Ne jamais
- Committer des clés, des fichiers `.env` ou des données personnelles.
- Fusionner sur `main` (c'est l'humain qui fusionne après revue).
- Supprimer ou affaiblir un test pour faire passer la CI.
- Ajouter une dépendance lourde sans en discuter (ADR).
- Cocher une tâche ou un jalon dont la DoD n'est pas vérifiée.

## Outils
- Écrire les fichiers longs (surtout les tests) avec l'outil `write`, pas avec un heredoc shell : les heredocs ont été tronqués en cours de fichier et les commandes suivantes du même appel ne se lançaient pas. Lancer `typecheck` / `test` dans un appel séparé et relire les avertissements du shell.
