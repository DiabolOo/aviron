# AGENTS.md — PulseFit

> Instructions pour tous les agents de code (Claude Code, Devin Desktop / Cascade…).
> Source de vérité du plan : `ROADMAP.md` (jalons, DoD, ADR). **Lis-le avant toute tâche.**

## Projet
PulseFit est une app mobile « agent-first » : l'utilisateur exprime une intention (texte ou voix), les agents préparent, il valide en 1 tap. Vision : un Life OS (sport, nutrition, puis agenda, objectifs, habitudes).
Stack : Expo SDK 57, Expo Router, TypeScript strict, NativeWind, Zustand. Backend prévu : Supabase (UE) — pas avant le jalon 5.

## Commandes
- `npm run typecheck` · `npm run lint` · `npm test` — **les trois doivent passer avant chaque commit.**
- `npx expo start` — lancer l'app en développement.

## Architecture (cible, voir ROADMAP.md)
```
src/core/     domaine pur testé (nutrition, charge d'entraînement, validation de plans) — sans React ni réseau
src/modules/  un dossier par module de vie (sport, nutrition, profile…), chacun avec un manifeste `LifeModule`
src/agent/    client de la passerelle LLM, routeur de modèles, prompts versionnés, outils
src/data/     repositories (interfaces) + adaptateurs mock / local / Supabase
src/ui/       design system (tokens, Card, ProposalCard, CommandBar…)
app/          routes Expo Router (fines : elles assemblent les modules)
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
9. **Source d'activité pour l'IA : pas de données Strava dans les prompts** tant que l'ADR-004 ne l'autorise pas (voir ROADMAP.md, jalon 8).

## Méthode de travail
- Un jalon = une branche `jalon-N-nom`. Une tâche = un commit petit et relisible.
- Dans le même commit : cocher la tâche dans `ROADMAP.md` et ajouter une ligne au Journal.
- Ne démarre jamais un jalon qui n'a pas été demandé. Ne modifie pas les jalons non démarrés.
- **Si tu es bloqué ou face à une décision** : écris la question dans `docs/questions.md` (format dans `docs/AGENT-WORKFLOW.md`) et passe à la tâche indépendante suivante. Ne devine jamais sur : secrets, choix légal, dépenses, suppression de données, décision d'architecture (→ ADR).
- Fin de jalon : vérifie la DoD, puis écris le résumé de revue (modèle dans `docs/AGENT-WORKFLOW.md`).

## Style
- TypeScript strict, pas de `any`, composants fonctionnels.
- Tokens du design system uniquement (aucune couleur en dur).
- Textes d'interface en français ; noms de code en anglais.
- Tests à côté du code (`*.test.ts`).

## Ne jamais
- Committer des clés, des fichiers `.env` ou des données personnelles.
- Fusionner sur `main` (c'est l'humain qui fusionne après revue).
- Supprimer ou affaiblir un test pour faire passer la CI.
- Ajouter une dépendance lourde sans en discuter (ADR).
- Cocher une tâche ou un jalon dont la DoD n'est pas vérifiée.
