# ADR-013 — Source des activités et éligibilité à l'IA

- **Date** : 2026-11-04
- **Statut** : Accepté — **lecture des conditions Strava à valider juridiquement** (voir Note)
- **Décideur** : Julien (propriétaire produit)
- **Amende** : ADR-004, point 3 (voir Conséquences)

---

## Contexte

D'après la politique API Strava (accord mis à jour le 1er juin 2026) et la FAQ développeurs, les
données Strava ne peuvent pas être utilisées dans des applications d'IA : prompts, embeddings,
RAG, **y compris les données dérivées** (ROADMAP, Jalon 8). Le coach IA (niveau 2) ne doit donc
jamais recevoir une activité venue de Strava, ni un chiffre calculé à partir d'elle.

Aujourd'hui, rien ne permet de garantir cette règle dans le code :

- le champ `Activity.source` est optionnel et ses valeurs (`apple_health`, `garmin`, `coros`,
  `fit_import`, `manual`, `strava`) ne disent pas si l'activité peut aller à l'IA ;
- une même sortie peut arriver par deux sources (montre → Apple Santé, et export Strava), et
  rien ne dit laquelle garder ;
- l'ADR-004 (point 3) autorise en dev un résumé calculé sur le snapshot, qui vient de Strava.

Les trois niveaux de personnalisation (ROADMAP, Voie MVP) restent le cadre : niveau 0 profil
déclaré, niveau 1 analyse sur le téléphone, niveau 2 coach IA avec accord explicite.

## Décision

1. **Chaque activité porte une source**, obligatoire :
   `source: 'strava' | 'coros' | 'garmin' | 'apple_health' | 'health_connect' | 'file' | 'phone' | 'manual'`.
   La source désigne le **canal d'import**, pas l'appareil d'enregistrement : c'est le canal qui
   décide des conditions applicables. Une activité enregistrée par une COROS mais importée depuis
   Strava a la source `strava`.
   - **Écriture croisée dans l'agrégateur** : une séance lue dans Apple Santé ou Health Connect
     mais **écrite par l'app Strava** prend la source `strava`, donc `aiEligible: false`. La
     provenance se lit dans le bundle id de `sourceRevision` (HealthKit) ou le package d'origine
     (Health Connect). Le canal Strava reste Strava même quand il passe par le système.
2. **Chaque activité peut porter un champ `device`** facultatif : le fabricant **lu dans le FIT**
   (champ `manufacturer` de `file_id`) quand il existe (ex. « COROS », « Garmin »). Il sert à
   l'affichage seulement et n'a **aucun effet** sur `aiEligible`.
3. **Chaque activité porte un champ `aiEligible: boolean`**, calculé à l'import par `src/core/`.
   Invariant : **`source === 'strava'` ⇒ `aiEligible === false`**, sans exception ni réglage
   qui le contourne.
4. **Doublons entre sources** : quand la même activité arrive par plusieurs sources, on garde un
   seul enregistrement. La déduplication passe avant le regroupement en séances (SPEC-v3, règle 4).
   - Toute source non-Strava l'emporte sur `strava`.
   - Entre sources non-Strava, ordre fixe :
     `coros` = `garmin` > `apple_health` = `health_connect` > `file` > `phone` > `manual`.
   - À égalité de rang, l'enregistrement qui a le plus de données (flux de FC, tours) l'emporte.
   - **Aucun champ de la copie Strava ne complète l'enregistrement gardé** (titre, tours, FC…) :
     il deviendrait une donnée dérivée de Strava.
5. **Résumé envoyé à l'IA** (`AthleteSummary`) : toute activité dont `aiEligible` est faux en est
   exclue, **y compris de ses agrégats** : volume, nombre de séances, régularité, tendances,
   records, courses, séances regroupées. Le résumé est calculé comme si ces activités
   n'existaient pas. **Une séance mixte** (une activité Strava et une activité d'une autre source
   regroupées) est exclue entière du résumé.
6. **L'analyse sur le téléphone (niveau 1) n'est pas concernée** : le moteur déterministe et les
   écrans utilisent toutes les activités, Strava comprise. Rien ne quitte le téléphone.
7. **Mention « Rédigé par l'IA »** : seuls les textes réellement rédigés par un modèle la portent
   (`CoachCard.source = 'ai'`). Les débriefs et constats calculés par le moteur portent
   « Calculé sur ton téléphone » (`'device'`), les programmes issus du profil « Programme établi
   d'après ton profil » (`'profile'`). Si l'IA échoue, le texte de repli du moteur s'affiche avec
   la mention `'device'`, sans message d'erreur (SPEC-v3 §1).

N'est pas implémenté ici : ce sera une étape séparée dans `src/core/`, avec ses tests.

## Note juridique

La lecture des conditions Strava ci-dessus est celle du propriétaire produit. Elle est **à
valider juridiquement avant la bêta** (M6), notamment :

- la portée de « données dérivées » ;
- **une archive exportée par l'utilisateur relève-t-elle des conditions de l'API Strava ?**
- l'affichage local, sans IA, de données issues de Strava.

## Conséquences

- **Schéma** : `ActivitySchema.source` devient obligatoire, `device` et `aiEligible` sont ajoutés.
  Valeurs actuelles : `apple_health`, `garmin`, `coros`, `manual`, `strava` inchangées ;
  `fit_import` devient `file` ; `health_connect` et `phone` sont nouvelles.
- **Snapshot de dev** : `fixtures/julien.snapshot.json` vient de l'export Strava. Toutes ses
  activités seront `aiEligible: false` ; il reste utilisable pour le niveau 1 (écrans, moteur).
- **Jeux synthétiques pour le coach IA** : M3 se développe sur des jeux synthétiques, un par
  profil de testeur (débutant, coureur du dimanche, sportif équipé), créés dans
  `fixtures/synthetic/` et **versionnés**. Ils ne contiennent **aucune donnée réelle**.
- **ADR-004, point 3, amendé** : « En dev, un résumé agrégé calculé sur ton snapshot peut
  alimenter le coach » n'est plus autorisé tant que le snapshot vient de Strava.
- **AGENTS.md, règle 9** : renvoie à cette ADR (`aiEligible`) au lieu de l'ADR-004.
- **Tests attendus** (étape d'implémentation) :
  - une séance écrite par l'app Strava (bundle id / package d'origine) prend `source: 'strava'`
    même importée via `apple_health` ou `health_connect` ;
  - l'invariant Strava ⇒ non éligible, quel que soit `device` ;
  - l'ordre de priorité des sources et le départage par quantité de données ;
  - aucun champ de la copie Strava dans l'enregistrement gardé ;
  - un résumé identique avec et sans les activités Strava présentes (volumes et tendances compris) ;
  - l'exclusion d'une séance mixte.

## Décisions adjacentes (même contexte, même date)

### Ressenti

Après une séance, le ressenti déclaré suit **une seule échelle à trois niveaux** :
`easy | moderate | hard`, libellés « **Facile · Correct · Dur** ». Il sert aux questions de
`CoachCard` (SPEC-v3 §1), aux débriefs et à l'ajustement du plan. Comme pour le reste, un
composant ne choisit pas les libellés : ils viennent de `src/core/`.

### Prédiction de semi (constat d'implémentation)

Vérifié le 2026-11-04 : `src/core/training/insights/thresholds.ts` **ne contient aucune règle de
prédiction de chrono** sur semi (Riegel ou autre). Les deux seules constantes liées à un objectif
de temps, `TARGET_PACE_MIN_SEC` / `TARGET_PACE_MAX_SEC` (allure visée plausible : 2:30–10:00 /km),
servent à **valider un temps déclaré**, pas à le prédire. Aucune règle n'est créée pour l'instant ;
si une prédiction est ajoutée, elle ira dans `src/core/` avec ses seuils dans `thresholds.ts`.
