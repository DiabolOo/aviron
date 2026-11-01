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
import { formatDuration } from '@/src/core/format';
import { formatKmTotal } from '@/src/core/sportFormat';
import { groupByMonth } from '@/src/core/sportWeek';
import type { StravaActivity } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

type Item =
  | { kind: 'header'; key: string; label: string; km: number; durationMin: number }
  | { kind: 'row'; key: string; activity: StravaActivity; first: boolean };

export default function ActivitiesScreen() {
  const activities = usePulseFitStore((s) => s.activities);
  const { colors } = useTheme();

  const items = useMemo<Item[]>(
    () =>
      groupByMonth(activities).flatMap((group) => [
        {
          kind: 'header' as const,
          key: `h-${group.key}`,
          label: group.label,
          km: group.items.reduce((sum, a) => sum + (a.distanceKm ?? 0), 0),
          durationMin: group.items.reduce((sum, a) => sum + a.durationMin, 0),
        },
        ...group.items.map((activity, index) => ({
          kind: 'row' as const,
          key: activity.id,
          activity,
          first: index === 0,
        })),
      ]),
    [activities],
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
              <View className="mt-8 flex-row items-center justify-between">
                <Label>{item.label}</Label>
                <Text className="font-mono text-[13px] text-muted">
                  {formatKmTotal(item.km)} · {formatDuration(item.durationMin)}
                </Text>
              </View>
            ) : (
              <ActivityRow activity={item.activity} first={item.first} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
