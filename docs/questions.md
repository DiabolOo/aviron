# Questions ouvertes pour Julien

> Les agents écrivent ici leurs questions bloquantes (format dans `docs/AGENT-WORKFLOW.md`).
> Réponds sous chaque question, puis passe le statut à « répondue ».

> **Règle donnée le 2026-11-08** : « Je veux tout faire comme les écrans des maquettes. » Pour
> chaque question ci-dessous, l'option retenue est celle qui reproduit les captures v3.4.

## Q1 — Valider l'amendement v3.4 de l'ADR-012 · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non (levé)
Contexte : les maquettes montrent la barre d'onglets dans le détail d'une séance (`106`–`108`, onglet Semaine actif) et dans le débrief (`212`, onglet Progrès actif), une semaine passée empilée (`109`), un débrief séparé du détail et un profil en modale (« Fermer », `213`). L'ADR-012 mettait le détail dans le Stack racine et fondait le débrief dans le détail.
Options : A) accepter l'amendement (piles par onglet, routes partagées d'Expo Router, `activity/[id]/debrief`) · B) garder le détail au niveau racine (barre masquée) et seulement ajouter la semaine passée et le débrief.
Recommandation de l'agent : A, c'est ce que montrent les captures.
Réponse de Julien : **A** — comme les maquettes. Amendement accepté.

## Q2 — Par où entre-t-on dans le débrief de course ? · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non
Contexte : `212` affiche « ‹ Semi de Reims » avec l'onglet Progrès actif, mais le détail d'une course (`107`) n'a pas de lien vers le débrief.
Options : A) Progrès › Tes semis ouvre le détail, qui gagne un lien « Voir le débrief » · B) Progrès › Tes semis ouvre directement le débrief (le retour porte le nom de la course) · C) les deux.
Recommandation de l'agent : A.
Réponse de Julien : **B** — comme les maquettes : le détail `107` reste sans lien ; une ligne de « Tes semis » ouvre le débrief, dont le retour porte le nom de la course (« ‹ Semi de Reims », « ‹ Semi de Reims 2025 ») et ramène à Progrès.

## Q3 — Mention de la source sur les cartes du coach · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non
Contexte : le code rend la source (« Calculé sur ton téléphone ») sur chaque `CoachCard`. Dans les détails `106`, `107` et `108`, les cartes « Ton coach » n'en ont pas (`106` a seulement la phrase « Environ »). Aujourd'hui, Coach et Semaine passée l'affichent.
Options : A) source toujours affichée · B) source omise sur le détail d'une séance · C) une seule fois par écran.
Recommandation de l'agent : A.
Réponse de Julien : **B** — comme les maquettes : pas de ligne de source sur le détail d'une séance (tout y est calculé sur le téléphone ; « Environ » s'affiche seul). Partout ailleurs, la source reste. Un texte rédigé par l'IA garde toujours « Rédigé par l'IA », détail compris (règle 9 d'AGENTS.md).

## Q4 — Semaine sans séance dans les graphiques de Progrès · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non
Contexte : `211` montre « — » au-dessus des semaines sans séance (4 et 25 mai) ; la règle commune dit « jamais de « — » ».
Options : A) trait plat sans libellé · B) accepter « — » dans les graphiques seulement.
Recommandation de l'agent : A.
Réponse de Julien : **B** — comme les maquettes : dans un graphique en barres, une période sans séance montre un trait plat surmonté de « — ». La règle « jamais de « — » » reste valable pour les tuiles et les chiffres.

## Q5 — Âge et jours disponibles hors de l'onboarding · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non
Contexte : l'onboarding maquetté (`210`) tient en quatre questions, sans âge (prévu pour estimer la FC max) ni jours disponibles (prévus pour le générateur de M5).
Options : A) FC max observée seulement, jours disponibles demandés par le coach ou déduits ; B) une 5e étape « Tes jours » ; C) les deux dans Profil › Toi, facultatifs.
Recommandation de l'agent : A pour l'âge, C pour les jours disponibles.
Réponse de Julien : **A** — comme les maquettes : quatre étapes, rien de plus. FC max observée (ou saisie existante) ; jours disponibles déduits de l'historique ou dits au Coach (« Je ne peux pas jeudi », `214`). Profil › Toi garde ses trois lignes (Niveau, Équipement, Objectif).

## Q6 — Toucher une séance prévue dans Semaine · refonte v3.1 · 2026-11-08
Statut : répondue
Bloquant : non
Contexte : `104` et `215` ne montrent que le toucher d'une séance faite (→ détail). Pour une séance prévue, rien n'est maquetté.
Options : A) rien (la ligne n'est pas touchable) · B) feuille avec la consigne, « Reporter » et « Modifier » · C) ouvrir le Coach avec la séance en contexte.
Recommandation de l'agent : B.
Réponse de Julien : **A** — comme les maquettes : une séance prévue n'est pas touchable dans Semaine. Elle se valide ou se reporte depuis Aujourd'hui ; elle se modifie en le demandant au Coach.
