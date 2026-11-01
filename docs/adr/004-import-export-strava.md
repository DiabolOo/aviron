# ADR-004 — Import de l'export Strava pour le moteur d'analyse

**Statut** : accepté — 2026-11-01

## Contexte
Le moteur d'analyse (M1) doit tourner sur de vraies données. L'archive Strava de l'utilisateur contient l'historique complet (CSV, FIT, GPX). Importer ce zip depuis un téléphone est un parcours pénible : demande d'archive sur le site, attente de l'e-mail, téléchargement, ouverture dans l'app.

## Décision
1. L'import de l'archive est un **outil de développement** : `scripts/import-strava.ts`, exécuté sur ordinateur, qui écrit `fixtures/julien.snapshot.json`. L'app n'embarque aucun import de zip pour le MVP.
2. Le snapshot, le zip et tout dossier `fixtures/real/` sont **gitignorés**. Le snapshot n'inclut ni `hrStream` ni `polyline` (taille, et données de localisation).
3. En dev, un résumé agrégé calculé sur ton snapshot peut alimenter le coach (données personnelles du développeur, sur son propre compte).
4. Pour les testeurs de la bêta, le coach ne reçoit que des résumés issus d'Apple Santé, de Health Connect ou de fichiers FIT, et seulement après consentement explicite.
5. Pas d'appel à l'API Strava : ses conditions d'utilisation interdisent d'utiliser ses données dans des modèles d'IA.

## Conséquences
- Un utilisateur dont l'historique est sur Strava le récupère via HealthFit (vers Apple Santé) ; une page web d'import est envisagée après la bêta, selon la demande.
- Le parseur reste en TypeScript pur dans `src/core/training`, donc réutilisable par cette page.
- Ajouter `fit-file-parser` (script d'import uniquement, devDependency) fait l'objet d'une ligne dans cet ADR plutôt que d'un second ADR.

## Amendement — 2026-11-01 : ville de départ des courses (`startCity`)
- **Courses uniquement** : le géocodage ne s'applique qu'aux activités détectées comme courses candidates (ou confirmées). Rien n'est calculé pour les entraînements.
- **Ville uniquement** : le script lit le premier point GPS de la trace (GPX, ou `position_lat`/`position_long` FIT en semicircles), cherche la ville la plus proche dans une liste embarquée (`src/core/training/import/cities-fr.ts`, GeoNames cities1000 filtré sur la France) et n'écrit que `startCity` (nom). Aucune coordonnée n'est stockée dans le snapshot ni ailleurs.
- **Jamais vers le coach** : `startCity` est exclu de `AthleteSummary` et de tout envoi au coach IA.
