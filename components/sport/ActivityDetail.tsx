import { useState, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';

import { HeartRateChart } from '@/components/sport/HeartRateChart';
import { HighlightLine } from '@/components/sport/HighlightLine';
import { PaceCurve } from '@/components/sport/PaceCurve';
import { RouteMap } from '@/components/sport/RouteMap';
import { SplitsList } from '@/components/sport/SplitsList';
import { SPORT_ICONS } from '@/components/sport/sportIcons';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { MIN_CURVE_POINTS } from '@/src/core/paceCurve';
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
  NBSP,
  nbspUnits,
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

/** Chiffres tabulaires pour tous les sports : les valeurs ne « dansent » pas d'un écran à l'autre. */
const TABULAR = { fontVariant: ['tabular-nums' as const] };

function Metric({ label, value, unit, sub, count }: MetricProps) {
  return (
    <View className="w-1/3 py-4">
      <Label>{label}</Label>
      <Text style={TABULAR} className="mt-1 text-2xl font-semibold tracking-tighter text-fg">
        {count ? <AnimatedNumber value={count.value} format={count.format} /> : value}
        {unit ? <Text className="text-sm font-normal text-muted">{NBSP}{unit}</Text> : null}
      </Text>
      {sub ? (
        <Text numberOfLines={1} style={TABULAR} className="mt-0.5 text-sm text-muted">
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

type Props = {
  activity: StravaActivity;
  /** moment fort précalculé sur l'index des comparables du snapshot, propre au sport (courses : `race.highlight` prime) */
  highlight: Highlight | null;
  /** « +12 % par rapport à ta médiane des 8 dernières semaines (8,2 km) » ; null sans assez de séances */
  comparison?: string | null;
  /** présent si l'activité est une course confirmée : chrono, allure officielle, distances, moment fort de course */
  race?: RaceSummary;
  onOpenRace: (raceId: string) => void;
};

/** « 21,1 km · 21,9 GPS » (la part GPS n'apparaît que si elle diffère de la distance officielle). */
function raceDistanceLine(race: RaceSummary): string {
  const official = `${formatKmNumber(race.officialKm)}${NBSP}km`;
  return race.measuredKm !== undefined && Math.abs(race.measuredKm - race.officialKm) >= 0.05
    ? `${official} · ${formatKmNumber(race.measuredKm)} GPS`
    : official;
}

/** Une visualisation (courbe, carte, FC) n'apparaît qu'à partir de 5 points. */
const MIN_VIZ_POINTS = MIN_CURVE_POINTS;

/**
 * Détail d'activité, squelette commun à tous les sports : en-tête, chiffre principal (distance, chrono de
 * course ou durée de muscu), 3 chiffres clés, ligne secondaire (calories, FC), moment fort, visualisation
 * (si au moins 5 points), comparaison à la médiane des 8 dernières semaines.
 */
export function ActivityDetail({ activity, highlight: highlightProp, comparison, race, onOpenRace }: Props) {
  const { colors } = useTheme();
  const sport = sportTokens(colors, activity.type);
  const SportIcon = SPORT_ICONS[activity.type];
  const [showSplits, setShowSplits] = useState(false);
  // Carte et courbes après la transition : l'en-tête et les chiffres s'affichent d'abord.
  const ready = useAfterInteractions('activité');
  const enhanced = activity.type === 'run';
  const isRace = race !== undefined;

  const distanceKm = activity.distanceKm ?? 0;
  const layout = activityLayout(activity.type);
  const hasDistance = layout.showDistance && distanceKm > 0;
  const hasHrCurve = activity.hrStream.length >= MIN_VIZ_POINTS;
  const hasRoute = activity.polyline.length >= MIN_VIZ_POINTS;
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

  const highlight = isRace ? (race?.highlight ?? null) : highlightProp;
  // Valeurs déjà visibles dans les chiffres clés : le moment fort ne les répète pas.
  const shown = new Set<string>([
    `${formatKmNumber(distanceKm)} km`,
    duration.main,
    ...(heroIsChrono && race?.timeSec !== undefined ? [formatRaceTime(race.timeSec)] : []),
    ...(effort ? [`${effort.value} ${effort.unit}`] : []),
    ...(racePaceSec !== undefined ? [`${formatPaceKm(racePaceSec)} /km`] : []),
  ]);
  // La durée est déjà le chiffre principal d'une séance de muscu : le moment fort ne la répète pas.
  const showHighlightValue = highlight ? highlight.kind !== 'longest_session' && !shown.has(highlight.value) : false;

  const hasCurve = enhanced && curveSegments(activity.splits).length >= MIN_VIZ_POINTS;
  const hasSplits = layout.showSplits && activity.splits.length > 0;

  const keyMetrics: ReactElement[] = [];
  if (hasDistance && !heroIsChrono) {
    keyMetrics.push(
      <Metric
        key="duration"
        label="Durée"
        value={duration.main}
        sub={duration.total}
        count={enhanced ? { value: durationSec, format: formatClock } : undefined}
      />,
    );
  }
  if (effort) {
    keyMetrics.push(
      <Metric
        key="effort"
        label={effort.label}
        value={racePaceSec !== undefined ? formatPaceKm(racePaceSec) : effort.value}
        unit={effort.unit}
        count={paceCount !== undefined ? { value: paceCount, format: formatSecAsClock } : undefined}
      />,
    );
  }
  if (layout.showElevation && (activity.elevationM ?? 0) > 0) {
    keyMetrics.push(<Metric key="elevation" label="Dénivelé" value={`${activity.elevationM}`} unit="m" />);
  }

  const secondary = [
    (activity.calories ?? 0) > 0 ? `${activity.calories} kcal` : undefined,
    (activity.avgHr ?? 0) > 0 ? `FC moy. ${activity.avgHr}${NBSP}bpm` : undefined,
    (activity.maxHr ?? 0) > 0 ? `FC max ${activity.maxHr}${NBSP}bpm` : undefined,
  ].filter((part): part is string => part !== undefined);

  return (
    <View>
      <View className="mt-6 flex-row items-start gap-3">
        <View
          testID="sport-icon"
          className="mt-1 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: sport.tint }}>
          <SportIcon color={sport.color} size={18} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={2} className="text-3xl font-semibold tracking-tight text-fg">
            {race ? race.title : displayActivityName(activity.name)}
          </Text>
          <Text className="mt-1 text-base text-muted">
            {formatDayLong(activity.date)} · {formatHour(activity.startTime)}
          </Text>
        </View>
      </View>

      <View className="mt-10 flex-row items-end">
        <Text testID="hero-value" style={TABULAR} className="text-6xl font-semibold tracking-tighter text-fg">
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
      {!hasDistance && duration.total ? (
        <Text numberOfLines={1} style={TABULAR} className="mt-1 text-base text-muted">
          {duration.total}
        </Text>
      ) : null}

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

      {keyMetrics.length > 0 ? <View className="mt-6 flex-row flex-wrap">{keyMetrics}</View> : null}

      {secondary.length > 0 ? (
        <Text testID="secondary-line" style={TABULAR} className="mt-1 text-sm text-muted">
          {secondary.join(' · ')}
        </Text>
      ) : null}

      {highlight ? <HighlightLine highlight={highlight} showValue={showHighlightValue} /> : null}

      {ready && hasRoute ? (
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

      {!isRace && comparison ? (
        <Text testID="comparison-line" className="mt-8 text-base text-muted">
          {nbspUnits(comparison)}
        </Text>
      ) : null}

      {hasSplits && enhanced ? (
        <View className="mt-6">
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

      {race?.originalName ? (
        <View testID="original-title" className="mt-8 border-t border-fg/5 pt-4">
          <Label>Titre d’origine</Label>
          <Text className="mt-1 text-sm text-fg">{race.originalName}</Text>
        </View>
      ) : null}
    </View>
  );
}
