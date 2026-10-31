export type ReadinessFactor = { label: string; value: string; weight: number; score: number };

export type Readiness = { score: number; label: string; factors: ReadinessFactor[] };

export function computeReadiness(input: {
  sleepHours: number;
  restingHrDelta: number;
  loadRatio: number;
}): Readiness {
  const sleep = Math.min(1, input.sleepHours / 8);
  const hr = Math.min(1, Math.max(0, 1 - Math.max(0, input.restingHrDelta) / 10));
  const load = Math.min(1, Math.max(0, 1 - Math.max(0, input.loadRatio - 1) / 0.5));
  const factors: ReadinessFactor[] = [
    { label: 'Sommeil', value: `${input.sleepHours} h`, weight: 0.4, score: sleep },
    {
      label: 'FC de repos',
      value: `${input.restingHrDelta > 0 ? '+' : ''}${input.restingHrDelta} bpm`,
      weight: 0.3,
      score: hr,
    },
    { label: 'Charge récente', value: `${Math.round(input.loadRatio * 100)} %`, weight: 0.3, score: load },
  ];
  const score = Math.round(factors.reduce((sum, f) => sum + f.weight * f.score, 0) * 100);
  const label = score >= 80 ? 'Optimale' : score >= 60 ? 'Correcte' : 'À ménager';
  return { score, label, factors };
}

export const MOCK_READINESS_INPUT = { sleepHours: 7.7, restingHrDelta: -2, loadRatio: 1 };
