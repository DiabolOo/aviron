import { router, useLocalSearchParams } from 'expo-router';
import { Activity, ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';

import { HeartRateChart } from '@/components/sport/HeartRateChart';
import { RouteMap } from '@/components/sport/RouteMap';
import { SplitsList } from '@/components/sport/SplitsList';
import { ErrorState } from '@/components/ui/ErrorState';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { activityDurationDisplay, activityLayout, activityPace, effortTimeSec, displayActivityName, formatDayLong, formatHour, formatKmNumber } from '@/src/core/sportFormat';
import { usePulseFitStore } from '@/lib/store';
import { useConfirmedRaceId } from '@/src/ui/useRaces';
import { useTheme } from '@/src/ui/useTheme';

const STRAVA_COLOR = '#FC4C02';

function Metric({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub?: string }) {
  return (
    <View className="w-1/3 py-4">
      <Label>{label}</Label>
      <Text className="mt-1 text-2xl font-semibold tracking-tighter text-fg">
        {value}
        {unit ? <Text className="text-xs font-normal text-muted"> {unit}</Text> : null}
      </Text>
      {sub ? <Text className="mt-0.5 text-xs text-muted">{sub}</Text> : null}
    </View>
  );
}

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = usePulseFitStore((s) => s.activities.find((item) => item.id === id));
  const { colors } = useTheme();
  const raceId = useConfirmedRaceId(id);

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

  const distanceKm = activity.distanceKm ?? 0;
  const layout = activityLayout(activity.type);
  const hasDistance = layout.showDistance && distanceKm > 0;
  const hasHrCurve = activity.hrStream.length >= 2;
  const effort = activityPace(
    activity.type,
    activity.distanceKm,
    effortTimeSec(activity),
  );
  const duration = activityDurationDisplay(activity, raceId !== undefined);
  const date = formatDayLong(activity.date);

  return (
    <Screen>
      {header}
      <Text className="mt-6 text-3xl font-semibold tracking-tight text-fg">
        {displayActivityName(activity.name)}
      </Text>
      <Text className="mt-1 text-sm text-muted">
        {date} · {formatHour(activity.startTime)}
      </Text>

      <View className="mt-6 flex-row items-end">
        <Text className="text-6xl font-semibold tracking-tighter text-fg">
          {hasDistance ? formatKmNumber(distanceKm) : duration.main}
        </Text>
        {hasDistance ? (
          <Text className="mb-2 ml-2 text-sm font-medium text-muted">km</Text>
        ) : null}
      </View>
      {!hasDistance && duration.total ? <Text className="mt-1 text-sm text-muted">{duration.total}</Text> : null}

      <View className="mt-2 flex-row flex-wrap">
        {hasDistance ? <Metric label="Durée" value={duration.main} sub={duration.total} /> : null}
        {effort ? <Metric label={effort.label} value={effort.value} unit={effort.unit} /> : null}
        {layout.showElevation && (activity.elevationM ?? 0) > 0 ? (
          <Metric label="Dénivelé" value={`${activity.elevationM}`} unit="m" />
        ) : null}
        {(activity.calories ?? 0) > 0 ? (
          <Metric label="Calories" value={`${activity.calories}`} unit="kcal" />
        ) : null}
        {(activity.avgHr ?? 0) > 0 ? (
          <Metric label="FC moy." value={`${activity.avgHr}`} unit="bpm" />
        ) : null}
        {(activity.maxHr ?? 0) > 0 ? (
          <Metric label="FC max" value={`${activity.maxHr}`} unit="bpm" />
        ) : null}
      </View>

      {raceId ? (
        <Pressable
          onPress={() => router.push(`/race/${raceId}`)}
          className="mt-6 h-[52px] items-center justify-center rounded-full bg-chip active:opacity-70">
          <Text className="text-[17px] font-semibold text-fg">Voir le débrief</Text>
        </Pressable>
      ) : null}

      {activity.polyline.length >= 2 ? (
        <View className="mt-8">
          <Label>Parcours</Label>
          <RouteMap polyline={activity.polyline} />
        </View>
      ) : null}

      {hasHrCurve ? (
        <View className="mt-8">
          <Label>Fréquence cardiaque</Label>
          <HeartRateChart stream={activity.hrStream} avgHr={activity.avgHr} />
        </View>
      ) : null}

      {layout.showSplits && activity.splits.length > 0 ? (
        <View className="mt-8">
          <Label>Splits</Label>
          <SplitsList splits={activity.splits} />
        </View>
      ) : null}
    </Screen>
  );
}
