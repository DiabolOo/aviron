@AGENTS.md

## Claude Code

- Commence chaque jalon en **mode plan** (Shift+Tab, ou `/plan`) : propose le découpage en tâches, attends la validation, puis exécute.
- Pour les jalons backend / cœur (J3, J6, J8), travaille en autonomie : une branche, un commit par tâche, `typecheck + lint + test` après chaque tâche.
- Pour l'UI (J4), propose une capture ou une description du résultat attendu avant d'enchaîner, car la relecture visuelle est humaine.
- Utilise des sous-agents pour explorer le code ou relire un diff sans polluer le contexte principal.
- Ne lis que les dossiers utiles à la tâche ; ne charge pas tout le dépôt.
- Si `ANTHROPIC_API_KEY` est défini dans l'environnement, signale-le : cela facture à l'usage au lieu de l'abonnement.
- **Parallélise toujours les opérations indépendantes** (lectures, écritures, recherches) : regroupe-les dans un seul message pour qu'elles s'exécutent simultanément. Ne séquentialise que quand une opération dépend du résultat d'une autre.
