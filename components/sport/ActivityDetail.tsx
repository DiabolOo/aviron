import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { HeartRateChart } from '@/components/sport/HeartRateChart';
import { HighlightCard } from '@/components/sport/HighlightCard';
import { PaceCurve } from '@/components/sport/PaceCurve';
import { RouteMap } from '@/components/sport/RouteMap';
import { SplitsList } from '@/components/sport/SplitsList';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { MIN_CURVE_SPLITS } from '@/src/core/paceCurve';
import {
  activityDurationDisplay,
  activityDurationSec,
  activityLayout,
  activityPace,
  displayActivityName,
  effortTimeSec,
  formatClock,
  formatDayLong,
  formatHour,
  formatKmNumber,
  formatSecAsClock,
} from '@/src/core/sportFormat';
import { fullSegments, highlightOf } from '@/src/core/training/highlights';
import type { StravaActivity } from '@/src/core/types';
import { CountTo } from '@/src/ui/motion/CountTo';

type MetricProps = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  /** valeur numérique animée à l'ouverture (remplace `value`) */
  count?: { value: number; format: (n: number) => string };
};

function Metric({ label, value, unit, sub, count }: MetricProps) {
  return (
    <View className="w-1/3 py-4">
      <Label>{label}</Label>
      <Text className="mt-1 text-2xl font-semibold tracking-tighter text-fg">
        {count ? <CountTo value={count.value} format={count.format} /> : value}
        {unit ? <Text className="text-xs font-normal text-muted"> {unit}</Text> : null}
      </Text>
      {sub ? <Text className="mt-0.5 text-xs text-muted">{sub}</Text> : null}
    </View>
  );
}

type Props = {
  activity: StravaActivity;
  /** toutes les activités (le moment fort compare à l'historique) */
  history: StravaActivity[];
  /** id de course si l'activité est une course confirmée */
  raceId?: string;
  /** FC max observée de l'athlète : sert aux zones de la courbe d'allure */
  maxHr?: number;
  onOpenRace: (raceId: string) => void;
};

/** Contenu du détail d'activité. Moment fort, courbe d'allure et splits repliables : course à pied d'abord. */
export function ActivityDetail({ activity, history, raceId, maxHr, onOpenRace }: Props) {
  const [showSplits, setShowSplits] = useState(false);
  const enhanced = activity.type === 'run';
  const highlight = useMemo(
    () => (enhanced ? highlightOf(activity, history) : null),
    [enhanced, activity, history],
  );

  const distanceKm = activity.distanceKm ?? 0;
  const layout = activityLayout(activity.type);
  const hasDistance = layout.showDistance && distanceKm > 0;
  const hasHrCurve = activity.hrStream.length >= 2;
  const isRace = raceId !== undefined;
  const effort = activityPace(activity.type, activity.distanceKm, effortTimeSec(activity));
  const duration = activityDurationDisplay(activity, isRace);
  const durationSec = activityDurationSec(activity, isRace);
  const paceSecPerKm = hasDistance ? effortTimeSec(activity) / distanceKm : undefined;
  const countablePace = enhanced && effort?.label === 'Allure' && paceSecPerKm !== undefined && paceSecPerKm > 0;
  const hasCurve = enhanced && fullSegments(activity.splits).length >= MIN_CURVE_SPLITS;
  const hasSplits = layout.showSplits && activity.splits.length > 0;

  return (
    <View>
      <Text className="mt-6 text-3xl font-semibold tracking-tight text-fg">{displayActivityName(activity.name)}</Text>
      <Text className="mt-1 text-base text-muted">
        {formatDayLong(activity.date)} · {formatHour(activity.startTime)}
      </Text>

      {highlight ? <HighlightCard highlight={highlight} /> : null}

      <View className="mt-6 flex-row items-end">
        <Text testID="hero-value" className="text-6xl font-semibold tracking-tighter text-fg">
          {enhanced && hasDistance ? (
            <CountTo value={distanceKm} format={formatKmNumber} />
          ) : hasDistance ? (
            formatKmNumber(distanceKm)
          ) : (
            duration.main
          )}
        </Text>
        {hasDistance ? <Text className="mb-2 ml-2 text-base font-medium text-muted">km</Text> : null}
      </View>
      {!hasDistance && duration.total ? <Text className="mt-1 text-base text-muted">{duration.total}</Text> : null}

      <View className="mt-2 flex-row flex-wrap">
        {hasDistance ? (
          <Metric
            label="Durée"
            value={duration.main}
            sub={duration.total}
            count={enhanced ? { value: durationSec, format: formatClock } : undefined}
          />
        ) : null}
        {effort ? (
          <Metric
            label={effort.label}
            value={effort.value}
            unit={effort.unit}
            count={countablePace ? { value: paceSecPerKm as number, format: formatSecAsClock } : undefined}
          />
        ) : null}
        {layout.showElevation && (activity.elevationM ?? 0) > 0 ? (
          <Metric label="Dénivelé" value={`${activity.elevationM}`} unit="m" />
        ) : null}
        {(activity.calories ?? 0) > 0 ? <Metric label="Calories" value={`${activity.calories}`} unit="kcal" /> : null}
        {(activity.avgHr ?? 0) > 0 ? <Metric label="FC moy." value={`${activity.avgHr}`} unit="bpm" /> : null}
        {(activity.maxHr ?? 0) > 0 ? <Metric label="FC max" value={`${activity.maxHr}`} unit="bpm" /> : null}
      </View>

      {raceId ? (
        <Pressable
          onPress={() => onOpenRace(raceId)}
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

      {hasCurve ? (
        <View className="mt-8">
          <Label>Allure</Label>
          <PaceCurve splits={activity.splits} maxHr={maxHr} />
        </View>
      ) : null}

      {hasSplits && enhanced ? (
        <View className="mt-8">
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSplits((v) => !v)}
            className="h-[52px] items-center justify-center rounded-full bg-chip active:opacity-70">
            <Text className="text-[17px] font-semibold text-fg">
              {showSplits ? 'Masquer le détail des splits' : 'Voir le détail des splits'}
            </Text>
          </Pressable>
          {showSplits ? <SplitsList splits={activity.splits} /> : null}
        </View>
      ) : null}

      {hasSplits && !enhanced ? (
        <View className="mt-8">
          <Label>Splits</Label>
          <SplitsList splits={activity.splits} />
        </View>
      ) : null}
    </View>
  );
}
