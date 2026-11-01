import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityRow } from '@/components/sport/ActivityRow';
import { Glow } from '@/components/ui/Glow';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { formatClock, formatSportKm } from '@/src/core/sportFormat';
import { groupByMonth, monthTotals, type MonthTotals } from '@/src/core/sportWeek';
import type { ActivityType, StravaActivity } from '@/src/core/types';
import { useConfirmedRaceMap } from '@/src/ui/useRaces';
import { useTheme } from '@/src/ui/useTheme';

const SPORT_LABELS: Record<ActivityType, string> = {
  run: 'Course',
  ride: 'Vélo',
  walk: 'Marche',
  swim: 'Nage',
  strength: 'Muscu',
  other: 'Autre',
};

type Item =
  | { kind: 'header'; key: string; label: string; totals: MonthTotals }
  | { kind: 'row'; key: string; activity: StravaActivity; first: boolean };

export default function ActivitiesScreen() {
  const activities = usePulseFitStore((s) => s.activities);
  const { colors } = useTheme();
  const raceMap = useConfirmedRaceMap();

  const items = useMemo<Item[]>(
    () =>
      groupByMonth(activities).flatMap((group) => [
        {
          kind: 'header' as const,
          key: `h-${group.key}`,
          label: group.label,
          totals: monthTotals(group.items, new Set(raceMap.keys())),
        },
        ...group.items.map((activity, index) => ({
          kind: 'row' as const,
          key: activity.id,
          activity,
          first: index === 0,
        })),
      ]),
    [activities, raceMap],
  );

  return (
    <View className="flex-1 bg-canvas">
      <Glow tone="suivi" />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 px-5 pt-4">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-fg/5 bg-surface active:opacity-70">
            <ChevronLeft color={colors.fg} size={20} strokeWidth={1.8} />
          </Pressable>
          <Text className="text-xl font-semibold tracking-tight text-fg">Historique</Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerClassName="px-5 pb-6 pt-2"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <View className="mt-8">
                <View className="flex-row items-center justify-between">
                  <Label>{item.label}</Label>
                  <Text className="font-mono text-[13px] text-muted">{formatClock(item.totals.durationSec)}</Text>
                </View>
                {item.totals.distances.length > 0 ? (
                  <Text className="mt-1 text-sm text-muted">
                    {item.totals.distances.map((d) => `${SPORT_LABELS[d.type]} ${formatSportKm(d.km)}`).join(' · ')}
                  </Text>
                ) : null}
              </View>
            ) : (
              <ActivityRow activity={item.activity} first={item.first} raceId={raceMap.get(item.activity.id)} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
