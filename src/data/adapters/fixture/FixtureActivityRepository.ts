import { z } from 'zod';

import { ActivitySchema, type Activity } from '@/src/core/schemas';
import type { IActivityRepository } from '@/src/data/repositories/IActivityRepository';

/**
 * Adaptateur de dev (M2, ADR-004) : sert les activités du snapshot d'export
 * Strava généré par `npm run import:strava` (fixtures/*.snapshot.json).
 * Le fichier est gitignoré (données personnelles) : quand il est absent,
 * metro.config.js le remplace par emptySnapshot.json au bundling et le
 * require() ci-dessous peut échouer sous Jest — le dépôt est alors vide.
 * Activé via EXPO_PUBLIC_USE_FIXTURE=1 ; jamais en production.
 */

const SnapshotEnvelopeSchema = z.object({ activities: z.array(z.unknown()) });

function loadFixture(): Activity[] {
  try {
    const raw: unknown = require('../../../../fixtures/julien.snapshot.json');
    const parsed = SnapshotEnvelopeSchema.safeParse(raw);
    if (!parsed.success) return [];
    return parsed.data.activities.flatMap((item) => {
      // Snapshots créés avant ADR-013 n'ont pas source/aiEligible : on ajoute les valeurs par
      // défaut (strava/false) car le snapshot vient de l'export Strava.
      const withDefaults =
        typeof item === 'object' && item !== null
          ? { source: 'strava', aiEligible: false, ...item }
          : item;
      const r = ActivitySchema.safeParse(withDefaults);
      return r.success ? [r.data] : [];
    });
  } catch {
    return [];
  }
}

export class FixtureActivityRepository implements IActivityRepository {
  private activities: Activity[] = loadFixture();

  async listAll(): Promise<Activity[]> {
    return [...this.activities].sort((a, b) => b.date.localeCompare(a.date));
  }

  async listRecent(n: number): Promise<Activity[]> {
    return (await this.listAll()).slice(0, n);
  }

  async listByDateRange(from: string, to: string): Promise<Activity[]> {
    return (await this.listAll()).filter((a) => a.date >= from && a.date <= to);
  }

  async add(activity: Activity): Promise<void> {
    const idx = this.activities.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      this.activities[idx] = activity;
    } else {
      this.activities.push(activity);
    }
  }

  async clear(): Promise<void> {
    this.activities = [];
  }
}
