import { router, useLocalSearchParams } from 'expo-router';
import { Activity, ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { HeartRateChart } from '@/components/sport/HeartRateChart';
import { RouteMap } from '@/components/sport/RouteMap';
import { SplitsList } from '@/components/sport/SplitsList';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { parseISODate } from '@/lib/dates';
import { formatDuration, formatPace, formatSpeed } from '@/lib/format';
import { usePulseFitStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

const STRAVA_COLOR = '#FC4C02';

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="w-1/3 py-4">
      <Label>{label}</Label>
      <Text className="mt-1 text-2xl font-semibold tracking-tighter text-fg">
        {value}
        {unit ? <Text className="text-xs font-normal text-muted"> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = usePulseFitStore((s) => s.activities.find((item) => item.id === id));
  const { colors } = useTheme();

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
        <Text className="mt-6 text-muted">Activité introuvable.</Text>
      </Screen>
    );
  }

  const isRide = activity.type === 'ride';
  const date = parseISODate(activity.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen>
      {header}
      <Text className="mt-6 text-3xl font-semibold tracking-tight text-fg">{activity.name}</Text>
      <Text className="mt-1 text-sm capitalize text-muted">
        {date} · {activity.startTime}
      </Text>

      <View className="mt-6 flex-row items-end">
        <Text className="text-6xl font-semibold tracking-tighter text-fg">
          {activity.distanceKm.toFixed(1)}
        </Text>
        <Text className="mb-2 ml-2 text-base text-muted">km</Text>
      </View>

      <View className="mt-2 flex-row flex-wrap">
        <Metric label="Durée" value={formatDuration(activity.movingTimeMin)} />
        <Metric
          label={isRide ? 'Vitesse' : 'Allure'}
          value={(isRide
            ? formatSpeed(activity.distanceKm, activity.movingTimeMin)
            : formatPace(activity.distanceKm, activity.movingTimeMin)
          ).replace(/ \/?(km\/h|km)$/, '')}
          unit={isRide ? 'km/h' : 'min/km'}
        />
        <Metric label="Dénivelé" value={`${activity.elevationM}`} unit="m" />
        <Metric label="Calories" value={`${activity.calories}`} unit="kcal" />
        <Metric label="FC moy." value={`${activity.avgHr}`} unit="bpm" />
        <Metric label="FC max" value={`${activity.maxHr}`} unit="bpm" />
      </View>

      <View className="mt-8">
        <Label>Parcours</Label>
        <RouteMap polyline={activity.polyline} />
      </View>

      <View className="mt-8">
        <Label>Fréquence cardiaque</Label>
        <HeartRateChart stream={activity.hrStream} avgHr={activity.avgHr} maxHr={activity.maxHr} />
      </View>

      <View className="mt-8">
        <Label>Splits</Label>
        <SplitsList splits={activity.splits} />
      </View>
    </Screen>
  );
}
