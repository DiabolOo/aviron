import { router, useLocalSearchParams } from 'expo-router';
import { Activity, ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { ActivityDetail } from '@/components/sport/ActivityDetail';
import { ErrorState } from '@/components/ui/ErrorState';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore } from '@/lib/store';
import { openRace, perfLog } from '@/src/ui/nav';
import { sportTokens } from '@/src/ui/theme/sportColors';
import { useActivityHighlight, useSportDerived } from '@/src/ui/useRaces';
import { useTheme } from '@/src/ui/useTheme';

const STRAVA_COLOR = '#FC4C02';

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activities = usePulseFitStore((s) => s.activities);
  const activity = useMemo(() => activities.find((item) => item.id === id), [activities, id]);
  const { colors } = useTheme();
  const derived = useSportDerived();
  const raceId = id ? derived.confirmedRaceMap.get(id) : undefined;
  const race = derived.raceSummaryFor(raceId);
  const highlight = useActivityHighlight(activity);

  useEffect(() => {
    perfLog('/activity premier rendu');
  }, []);

  const header = (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full border border-fg/5 bg-surface active:opacity-70">
        <ChevronLeft color={colors.fg} size={20} strokeWidth={1.8} />
      </Pressable>
      <View className="flex-row items-center gap-1.5 rounded-full bg-fg/5 px-3 py-1.5">
        <Activity color={STRAVA_COLOR} size={13} strokeWidth={2.2} />
        <Label>Strava</Label>
      </View>
    </View>
  );

  if (!activity) {
    return (
      <Screen>
        {header}
        <ErrorState
          className="mt-10"
          title="Activité introuvable"
          description="Cette activité n'existe plus ou n'a pas été synchronisée."
          retryLabel="Retour"
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen glowTint={sportTokens(colors, activity.type).tint}>
      {header}
      <ActivityDetail
        activity={activity}
        highlight={highlight}
        race={race}
        onOpenRace={openRace}
      />
    </Screen>
  );
}
