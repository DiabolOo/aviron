# Flux de travail agents — PulseFit

Objectif : que les agents avancent jalon par jalon, et que tu n'interviennes qu'à trois moments :
1. **Au départ** : tu valides le plan du jalon (une seule fois).
2. **En cours** : seulement si une question bloquante apparaît dans `docs/questions.md`.
3. **À la fin** : tu relis le résumé, testes sur ton téléphone, puis tu fusionnes.

## Ordre conseillé
| Ordre | Jalon | Autonomie | Pourquoi |
|---|---|---|---|
| 1 | J3 Socle modulaire | Haute | Code pur, très testable |
| 2 | J4 UX v2 | Moyenne | Besoin de ton œil sur l'ergonomie |
| 3 | J6 Agent Core (version alpha) | Haute | Schémas, passerelle, évals |
| 4 | J7 Nutrition IA | Moyenne | Besoin de photos réelles pour les évals |
| 5 | J8 Données (FIT COROS + Apple Health) | Moyenne | Besoin de ton fichier FIT et de ton iPhone |
| 6 | J9 Coach IA | Moyenne | Validation du ton et de la pertinence des plans |

Pré-requis avant de lancer un agent autonome : tous les secrets nécessaires sont dans un fichier local `.env` (jamais commité) ou dans le coffre de l'outil, pour qu'il n'ait pas à les demander.

## Modèle de prompt de jalon (à coller)
```
Lis AGENTS.md et ROADMAP.md.
Objectif : réaliser le Jalon <N> — <titre> (tâches et DoD dans ROADMAP.md).

1. Passe en mode plan : propose le découpage en tâches (une tâche = un commit) et la liste des fichiers / dossiers touchés. Attends ma validation.
2. Après validation : crée la branche jalon-<N>-<nom>, exécute les tâches une par une.
   Après chaque tâche : npm run typecheck && npm run lint && npm test. Corrige avant de continuer.
   Coche la tâche dans ROADMAP.md et ajoute une ligne au Journal dans le même commit.
3. Si une décision ou une information te manque : écris-la dans docs/questions.md, continue sur une tâche indépendante, ne devine pas.
4. Fin de jalon : vérifie chaque point de la DoD, puis écris le résumé de revue (modèle dans docs/AGENT-WORKFLOW.md) dans docs/reviews/jalon-<N>.md.
Ne fusionne pas sur main. Ne touche pas aux jalons suivants.
```

## Format de `docs/questions.md`
```
## Q<n> — <titre court> · jalon <N> · <date>
Statut : ouverte | répondue
Bloquant : oui / non (quelle tâche attend)
Contexte : 2 à 3 lignes
Options : A) … B) …
Recommandation de l'agent : …
Réponse de Julien : (à remplir)
```

## Modèle de résumé de revue (`docs/reviews/jalon-<N>.md`)
```
# Revue Jalon <N>
- Tâches faites / non faites :
- DoD : point par point, preuve (test, capture, commande)
- Décisions prises (ADR créés) :
- Questions ouvertes :
- Risques et dette technique :
- Comment tester sur le téléphone (3 à 5 étapes) :
- Fichiers principaux modifiés :
```

## Checklist de revue de fin de jalon (10 à 15 minutes)
1. Lire le résumé de revue et la DoD.
2. `git diff main --stat` : les dossiers touchés correspondent-ils au jalon ?
3. `npm run typecheck && npm run lint && npm test` en local.
4. Lancer l'app et dérouler les « étapes de test » du résumé.
5. Chercher les secrets : `git diff main | grep -iE "sk-|api[_-]?key|secret|token"`.
6. Vérifier qu'aucun test n'a été supprimé ou désactivé.
7. Vérifier l'invariant du bilan du jour (une seule source) et l'absence de couleurs en dur (jalons UI).
8. Répondre aux questions de `docs/questions.md`.
9. Fusionner sur `main`, passer le jalon à ✅ dans la roadmap.

## Parallélisme (quand plusieurs jalons sont indépendants)
Un worktree git par branche : `git worktree add ../pulsefit-j3 jalon-3-socle`, une session d'agent par worktree. Ne parallélise que des jalons qui touchent des dossiers différents (ex. `src/core/` et `src/agent/`), jamais deux agents sur les mêmes fichiers.
