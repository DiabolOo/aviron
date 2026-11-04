import type { Activity } from '../../schemas';

/** Famille de sport : chaque type d'activité est sa propre famille. */
export type SportFamily = Activity['type'];

/**
 * Une séance est un groupe d'une ou plusieurs activités.
 * Les activités restent la source de vérité et ne sont jamais modifiées.
 */
export type Session = {
  /** Identifiant stable : 's_' + id de la première activité (ordre chronologique).
   *  Ne change pas quand des activités sont ajoutées au groupe. */
  id: string;
  /** Type de la première activité (toutes les activités d'une séance ont le même type). */
  sport: Activity['type'];
  /** Alias de `sport` — même valeur, exposé pour la cohérence de l'API. */
  familySport: SportFamily;
  /** Instant de début de la première activité (ISO offset). */
  startedAt: string;
  /** Instant de fin de la dernière activité (ISO offset). */
  endedAt: string;
  /** Ids des activités dans l'ordre chronologique. */
  activityIds: string[];
  /** Somme des temps en mouvement des activités (en secondes). */
  movingTimeSec: number;
  /** Durée totale du premier début à la dernière fin (en secondes). */
  elapsedTimeSec: number;
  /** Distance totale (somme des activités qui en ont une). Absent si aucune activité n'a de distance. */
  distanceM?: number;
  /** FC moyenne pondérée par le temps en mouvement, sur les activités qui ont de la FC.
   *  Absent si aucune activité n'a de FC. */
  avgHr?: number;
  /** Vrai uniquement si TOUTES les activités de la séance ont aiEligible: true. */
  aiEligible: boolean;
  /** Rôles des activités dans la séance, issus des overrides uniquement. */
  roles?: Record<string, 'warmup' | 'main' | 'cooldown'>;
};

// ─── Overrides ───────────────────────────────────────────────────────────────

/** Force l'ouverture d'une nouvelle séance à cette activité (empêche tout regroupement avec la précédente). */
export type SplitOverride = { type: 'split'; activityId: string };

/**
 * Force le regroupement de ces activités, sans tenir compte de l'écart ni du jour.
 * Si les activités ne sont pas de la même famille, l'override est ignoré.
 */
export type MergeOverride = { type: 'merge'; activityIds: string[] };

/** Attribue un rôle à une activité dans sa séance. */
export type RoleOverride = {
  type: 'role';
  activityId: string;
  role: 'warmup' | 'main' | 'cooldown';
};

export type GroupOverride = SplitOverride | MergeOverride | RoleOverride;

// ─── Options ─────────────────────────────────────────────────────────────────

export type GroupSessionsOptions = {
  /** IANA timezone pour déterminer le « même jour local » (défaut : Europe/Paris). */
  timezone?: string;
  /** Désactive tout regroupement : chaque activité devient sa propre séance. */
  neverGroup?: boolean;
};

// ─── Résultat ─────────────────────────────────────────────────────────────────

export type GroupSessionsResult = {
  sessions: Session[];
  /** Overrides de type 'merge' ignorés (familles différentes ou activités introuvables). */
  ignoredMergeOverrides: MergeOverride[];
};
