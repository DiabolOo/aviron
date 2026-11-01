import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { HeartRateChart } from '@/components/sport/HeartRateChart';
import { HighlightLine } from '@/components/sport/HighlightLine';
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
import { curveSegments, type Highlight } from '@/src/core/training/highlights';
import { formatPaceKm, formatRaceTime, type RaceSummary } from '@/src/core/training/raceView';
import type { StravaActivity } from '@/src/core/types';
import { AnimatedNumber } from '@/src/ui/motion/AnimatedNumber';
import { useAfterInteractions } from '@/src/ui/motion/useAfterInteractions';
import { sportTokens } from '@/src/ui/theme/sportColors';
import { useTheme } from '@/src/ui/useTheme';

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
        {count ? <AnimatedNumber value={count.value} format={count.format} /> : value}
        {unit ? <Text className="text-sm font-normal text-muted"> {unit}</Text> : null}
      </Text>
      {sub ? <Text className="mt-0.5 text-sm text-muted">{sub}</Text> : null}
    </View>
  );
}

type Props = {
  activity: StravaActivity;
  /** moment fort précalculé sur l'index des comparables du snapshot (races : `race.highlight` prime) */
  highlight: Highlight | null;
  /** présent si l'activité est une course confirmée : chrono, allure officielle, distances, moment fort de course */
  race?: RaceSummary;
  onOpenRace: (raceId: string) => void;
};

/** « 21,1 km · 21,9 GPS » (la part GPS n'apparaît que si elle diffère de la distance officielle). */
function raceDistanceLine(race: RaceSummary): string {
  const official = `${formatKmNumber(race.officialKm)} km`;
  return race.measuredKm !== undefined && Math.abs(race.measuredKm - race.officialKm) >= 0.05
    ? `${official} · ${formatKmNumber(race.measuredKm)} GPS`
    : official;
}

/**
 * Détail d'activité : héros et chiffres clés directement sur le fond, une ligne de moment fort,
 * cartes réservées à la courbe d'allure et aux splits. Course à pied d'abord (les autres sports gardent
 * l'ancien contenu sans moment fort ni courbe).
 */
export function ActivityDetail({ activity, highlight: highlightProp, race, onOpenRace }: Props) {
  const { colors } = useTheme();
  const sport = sportTokens(colors, activity.type);
  const [showSplits, setShowSplits] = useState(false);
  // Carte et courbes après la transition : l'en-tête et les chiffres s'affichent d'abord.
  const ready = useAfterInteractions('activité');
  const enhanced = activity.type === 'run';
  const isRace = race !== undefined;

  const distanceKm = activity.distanceKm ?? 0;
  const layout = activityLayout(activity.type);
  const hasDistance = layout.showDistance && distanceKm > 0;
  const hasHrCurve = activity.hrStream.length >= 2;
  const effort = activityPace(activity.type, activity.distanceKm, effortTimeSec(activity));
  const duration = activityDurationDisplay(activity, isRace);
  const durationSec = activityDurationSec(activity, isRace);
  const movingPaceSec = hasDistance ? effortTimeSec(activity) / distanceKm : undefined;

  // Course confirmée : chrono en héros, allure officielle (chrono / distance officielle).
  const racePaceSec = race?.officialPaceSec;
  const heroIsChrono = isRace && race?.timeSec !== undefined;
  const paceCount =
    enhanced && effort?.label === 'Allure'
      ? racePaceSec ?? (movingPaceSec !== undefined && movingPaceSec > 0 ? movingPaceSec : undefined)
      : undefined;
  const avgPaceSec = racePaceSec ?? movingPaceSec;

  const highlight = !enhanced ? null : isRace ? (race?.highlight ?? null) : highlightProp;
  // Valeurs déjà visibles dans les chiffres clés : le moment fort ne les répète pas.
  const shown = new Set<string>([
    `${formatKmNumber(distanceKm)} km`,
    duration.main,
    ...(heroIsChrono && race?.timeSec !== undefined ? [formatRaceTime(race.timeSec)] : []),
    ...(effort ? [`${effort.value} ${effort.unit}`] : []),
    ...(racePaceSec !== undefined ? [`${formatPaceKm(racePaceSec)} /km`] : []),
  ]);
  const showHighlightValue = highlight ? !shown.has(highlight.value) : false;

  const hasCurve = enhanced && curveSegments(activity.splits).length >= MIN_CURVE_SPLITS;
  const hasSplits = layout.showSplits && activity.splits.length > 0;

  return (
    <View>
      <Text numberOfLines={2} className="mt-6 text-3xl font-semibold tracking-tight text-fg">
        {displayActivityName(activity.name)}
      </Text>
      <Text className="mt-1 text-base text-muted">
        {formatDayLong(activity.date)} · {formatHour(activity.startTime)}
      </Text>

      <View className="mt-10 flex-row items-end">
        <Text testID="hero-value" className="text-6xl font-semibold tracking-tighter text-fg">
          {enhanced && heroIsChrono ? (
            <AnimatedNumber value={race?.timeSec ?? 0} format={formatRaceTime} />
          ) : enhanced && hasDistance ? (
            <AnimatedNumber value={distanceKm} format={formatKmNumber} />
          ) : hasDistance ? (
            formatKmNumber(distanceKm)
          ) : (
            duration.main
          )}
        </Text>
        {hasDistance && !heroIsChrono ? <Text className="mb-2 ml-2 text-base font-medium text-muted">km</Text> : null}
      </View>
      {!hasDistance && duration.total ? <Text className="mt-1 text-base text-muted">{duration.total}</Text> : null}

      {race ? (
        <View className="mt-3">
          <Text testID="race-distance" className="text-lg text-muted">
            {raceDistanceLine(race)}
          </Text>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => onOpenRace(race.raceId)}
            className="mt-2 self-start active:opacity-70">
            <Text className="text-base font-semibold text-fg underline">Voir le débrief</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="mt-6 flex-row flex-wrap">
        {hasDistance && !heroIsChrono ? (
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
            value={racePaceSec !== undefined ? formatPaceKm(racePaceSec) : effort.value}
            unit={effort.unit}
            count={paceCount !== undefined ? { value: paceCount, format: formatSecAsClock } : undefined}
          />
        ) : null}
        {layout.showElevation && (activity.elevationM ?? 0) > 0 ? (
          <Metric label="Dénivelé" value={`${activity.elevationM}`} unit="m" />
        ) : null}
        {(activity.calories ?? 0) > 0 ? <Metric label="Calories" value={`${activity.calories}`} unit="kcal" /> : null}
        {(activity.avgHr ?? 0) > 0 ? <Metric label="FC moy." value={`${activity.avgHr}`} unit="bpm" /> : null}
        {(activity.maxHr ?? 0) > 0 ? <Metric label="FC max" value={`${activity.maxHr}`} unit="bpm" /> : null}
      </View>

      {highlight ? <HighlightLine highlight={highlight} showValue={showHighlightValue} /> : null}

      {ready && activity.polyline.length >= 2 ? (
        <View className="mt-12">
          <Label>Parcours</Label>
          <RouteMap polyline={activity.polyline} />
        </View>
      ) : null}

      {ready && hasHrCurve ? (
        <View className="mt-12">
          <Label>Fréquence cardiaque</Label>
          <HeartRateChart stream={activity.hrStream} avgHr={activity.avgHr} />
        </View>
      ) : null}

      {ready && hasCurve ? (
        <View className="mt-12">
          <Label>Allure</Label>
          <PaceCurve splits={activity.splits} color={sport.color} avgPaceSec={avgPaceSec} highlightKm={highlight?.km} race={isRace} />
        </View>
      ) : null}

      {hasSplits && enhanced ? (
        <View className="mt-8">
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setShowSplits((v) => !v)}
            className="self-start py-2 active:opacity-70">
            <Text className="text-base text-muted underline">
              {showSplits ? 'Masquer le détail des splits' : 'Voir le détail des splits'}
            </Text>
          </Pressable>
          {showSplits ? <SplitsList splits={activity.splits} /> : null}
        </View>
      ) : null}

      {hasSplits && !enhanced ? (
        <View className="mt-12">
          <Label>Splits</Label>
          <SplitsList splits={activity.splits} />
        </View>
      ) : null}
    </View>
  );
}
