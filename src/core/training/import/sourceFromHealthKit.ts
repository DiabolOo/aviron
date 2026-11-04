import type { Activity } from '../../schemas';

export type ActivitySource = Activity['source'];

export type SourceResult = {
  source: ActivitySource;
  aiEligible: boolean;
};

/**
 * Liste blanche des préfixes de bundle id (HealthKit) et de package (Health Connect).
 *
 * Règle : seuls les écrivains Apple natifs, COROS et Garmin donnent aiEligible: true.
 * Tout autre écrivain tiers donne aiEligible: false (défaut prudent : une app tierce peut
 * avoir recopié des données Strava).
 *
 * ⚠️  Ces préfixes sont à confirmer sur un échantillon HealthKit réel avant TestFlight.
 *     Voir amendement ADR-013.
 */
export const HEALTHKIT_BUNDLE_PREFIXES: readonly {
  prefix: string;
  source: ActivitySource;
  aiEligible: boolean;
}[] = [
  // Strava — toujours non éligible
  { prefix: 'com.strava', source: 'strava', aiEligible: false },
  // Appareils Apple natifs (Workout, Health, Fitness)
  { prefix: 'com.apple.health', source: 'apple_health', aiEligible: true },
  { prefix: 'com.apple.workout', source: 'apple_health', aiEligible: true },
  { prefix: 'com.apple.fitness', source: 'apple_health', aiEligible: true },
  // COROS
  { prefix: 'com.coros', source: 'coros', aiEligible: true },
  // Garmin
  { prefix: 'com.garmin', source: 'garmin', aiEligible: true },
];

/**
 * Détermine la source et l'éligibilité IA d'une activité lue dans Apple Santé (HealthKit)
 * ou Health Connect, à partir du bundle id (iOS) ou du nom de package (Android) de l'app
 * qui a écrit l'enregistrement.
 *
 * Une séance écrite par l'app Strava (bundle id « com.strava… ») prend la source 'strava'
 * et aiEligible: false, même si elle transite par HealthKit ou Health Connect.
 *
 * Défaut prudent : écrivain inconnu → source 'apple_health', aiEligible: false.
 */
export function sourceFromHealthKit(sourceBundleId: string): SourceResult {
  const id = sourceBundleId.toLowerCase().trim();
  for (const entry of HEALTHKIT_BUNDLE_PREFIXES) {
    if (id.startsWith(entry.prefix)) {
      return { source: entry.source, aiEligible: entry.aiEligible };
    }
  }
  // Défaut prudent : app tierce inconnue
  return { source: 'apple_health', aiEligible: false };
}
