import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { Activity } from '@/src/core/schemas';
import { buildSportTrends, type SportTrends } from '@/src/core/training/engine';
import { FixtureActivityRepository } from '@/src/data/adapters/fixture/FixtureActivityRepository';
import { SportTrendsCard } from '@/src/modules/sport/SportTrendsCard';

// Écran de dev : la carte « Tendances sport » dans ses états représentatifs.
const TODAY = '2026-11-02';

function run(id: string, date: string, km: number, min: number, avgHr?: number, maxHr?: number): Activity {
  return { id, name: 'Sortie', type: 'run', date, startTime: '08:00', durationMin: min, distanceKm: km, avgHr, maxHr };
}

// 1 — tout vide : aucune activité, pas de FC max ni d'âge
const EMPTY = buildSportTrends({ activities: [], today: TODAY });

// 2 — quelques sorties sans FC : volume seul, intensités/efficacité insuffisantes
const NO_HR = buildSportTrends({
  activities: [run('1', '2026-10-28', 10, 50), run('2', '2026-10-21', 8, 40), run('3', '2026-11-01', 6, 30)],
  today: TODAY,
  ageYears: 40,
});

// 3 — semaine en cours vide : calage sur les dernières activités + intensités OK (FC observée)
const STALE = buildSportTrends({
  activities: [
    run('a', '2026-10-20', 10, 60, 150, 195),
    run('b', '2026-10-18', 8, 50, 145),
    run('c', '2026-10-13', 12, 70, 170),
    run('d', '2026-10-06', 6, 35, 155),
    run('e', '2026-09-28', 9, 55, 148),
  ],
  today: TODAY,
});

// 4 — complet : intensités + efficacité sur plusieurs mois, FC max saisie
const month = (prefix: string, min: number, n = 4) =>
  Array.from({ length: n }, (_, i) => run(`${prefix}${i}`, `${prefix}-${String(3 + i * 7).padStart(2, '0')}`, 10, min, 150, 192));
const FULL = buildSportTrends({
  activities: [
    ...month('2026-08', 56),
    ...month('2026-09', 52),
    ...month('2026-10', 50),
    run('x', '2026-11-01', 7, 38, 146),
  ],
  today: TODAY,
  configuredMaxHr: 192,
});

// 5 — proche des données réelles : semaine vide, 12 semaines sans FC, dernière FC en juin
const REAL_LIKE = buildSportTrends({
  activities: [
    run('r1', '2026-05-12', 10, 55, 150, 190),
    run('r2', '2026-05-20', 9, 50, 148),
    run('r3', '2026-06-03', 12, 70, 152, 191),
    run('r4', '2026-08-30', 6, 35),
    run('r5', '2026-09-14', 8, 45),
    run('r6', '2026-09-30', 10, 55),
    run('r7', '2026-10-08', 12, 66),
    run('r8', '2026-10-15', 5, 28),
    run('r9', '2026-10-22', 21, 118),
  ],
  today: '2026-11-01',
  ageYears: 40,
});

const STATES: { id: string; title: string; trends: SportTrends }[] = [
  { id: 'empty', title: '1 · Tout vide', trends: EMPTY },
  { id: 'nohr', title: '2 · Sans FC', trends: NO_HR },
  { id: 'stale', title: '3 · Semaine vide', trends: STALE },
  { id: 'full', title: '4 · Complet', trends: FULL },
  { id: 'real', title: '5 · Cas réel (sans FC récente)', trends: REAL_LIKE },
];

/** Écran de prévisualisation — dev uniquement, ne rend rien dans l'app livrée. */
export function StatsPreviewScreen() {
  // ?only=<id> (web) : n'affiche qu'un état — utile pour les captures
  const only =
    typeof window === 'undefined' || !window.location?.search
      ? undefined
      : new URLSearchParams(window.location.search).get('only');
  const [real, setReal] = useState<SportTrends | undefined>();
  useEffect(() => {
    // Vraies données (fixtures/julien.snapshot.json ; stub vide sur un clone sans le fichier)
    void new FixtureActivityRepository()
      .listAll()
      .then((activities) =>
        setReal(buildSportTrends({ activities, today: new Date().toISOString().slice(0, 10) })),
      );
  }, []);
  if (!__DEV__) return null;
  const states = [
    ...(real ? [{ id: 'snapshot', title: '0 · Snapshot réel', trends: real }] : []),
    ...STATES,
  ].filter((s) => !only || s.id === only);
  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-4 p-4">
      {states.map((s) => (
        <View key={s.id} className="gap-2">
          <Text className="text-[13px] font-semibold uppercase tracking-widest text-muted">{s.title}</Text>
          <SportTrendsCard trends={s.trends} />
        </View>
      ))}
    </ScrollView>
  );
}
