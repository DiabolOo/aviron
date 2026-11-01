import type { Activity } from '../../schemas';
import { quarterKey } from './periods';

export interface QuarterEfficiency {
  quarter: string;
  sessions: number;
  /** allure moyenne (s/km), moyenne pondérée par la distance */
  avgPaceSecPerKm?: number;
  avgHr?: number;
  /** efficacité aérobie : médiane des (m/min) / bpm par sortie — monte quand on va plus vite à FC égale */
  ef?: number;
  /** true à partir de 3 sorties de plus de 5 km avec FC dans le trimestre */
  reliable: boolean;
}

export interface EfficiencyOptions {
  types?: Activity['type'][];
  minDistanceKm?: number;
}

/**
 * Efficacité aérobie par trimestre : vitesse moyenne rapportée à la FC moyenne.
 * Ne compte que les sorties avec distance et FC connues.
 */
export function aerobicEfficiency(
  activities: Activity[],
  opts: EfficiencyOptions = {},
): QuarterEfficiency[] {
  const minKm = opts.minDistanceKm ?? 3;
  const buckets = new Map<
    string,
    { distM: number; durS: number; hrSumW: number; hrDistM: number; efs: number[]; n: number; hrLong: number }
  >();

  for (const a of activities) {
    if (opts.types && !opts.types.includes(a.type)) continue;
    const distM = (a.distanceKm ?? 0) * 1000;
    if (distM < minKm * 1000) continue;
    const key = quarterKey(a.date);
    let b = buckets.get(key);
    if (!b) {
      b = { distM: 0, durS: 0, hrSumW: 0, hrDistM: 0, efs: [], n: 0, hrLong: 0 };
      buckets.set(key, b);
    }
    b.distM += distM;
    b.durS += a.durationMin * 60;
    b.n++;
    if (a.avgHr !== undefined) {
      b.hrDistM += distM;
      b.hrSumW += a.avgHr * distM;
      b.efs.push(distM / a.durationMin / a.avgHr);
      if (distM > 5000) b.hrLong++;
    }
  }

  return [...buckets.entries()]
    .map(([quarter, b]) => {
      const avgPaceSecPerKm = b.distM > 0 ? Math.round(b.durS / (b.distM / 1000)) : undefined;
      const avgHr = b.hrDistM > 0 ? b.hrSumW / b.hrDistM : undefined;
      const sorted = [...b.efs].sort((x, y) => x - y);
      const med = sorted.length
        ? sorted.length % 2
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : undefined;
      return {
        quarter,
        sessions: b.n,
        avgPaceSecPerKm,
        avgHr: avgHr !== undefined ? Math.round(avgHr * 10) / 10 : undefined,
        ef: med !== undefined ? Math.round(med * 1000) / 1000 : undefined,
        reliable: b.hrLong >= 3,
      };
    })
    .sort((a, b) => a.quarter.localeCompare(b.quarter));
}
