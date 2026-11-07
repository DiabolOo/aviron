import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePulseFitStore } from '@/lib/store';
import { NBSP } from '@/src/core/sportFormat';
import type { Activity } from '@/src/core/schemas';
import { groupSessions, resolveSession, type GroupOverride, type Session } from '@/src/core/training/sessions';
import { buildSessionView, sourceBadge, type SessionView } from '@/src/core/training/sessions/sessionView';
import { DEBRIEF_NO_FC, gpsLegendFr, STRENGTH_FC_NOTE } from '@/src/core/training/insights/copy.fr';
import { activityLayout, formatClock, formatKm, formatKmNumber } from '@/src/core/sportFormat';
import { stravaToActivity } from '@/src/data/mappers';
import { makeStyles, useTheme, type Palette } from '@/src/design';
import { CoachCard } from '@/src/ui/CoachCard';
import { EffortPill, type EffortLevel } from '@/src/ui/EffortPill';
import { EmptyState } from '@/src/ui/EmptyState';
import { HeroMetric } from '@/src/ui/HeroMetric';
import { RaceBands } from '@/src/ui/RaceBands';
import { SessionParts } from '@/src/ui/SessionParts';
import { Skeleton } from '@/src/ui/Skeleton';
import { SplitsList } from '@/src/ui/SplitsList';
import { Text } from '@/src/ui/Text';
import { UndoToast } from '@/src/ui/UndoToast';
import { perfLog } from '@/src/ui/nav';
import { useSportDerived } from '@/src/ui/useRaces';

// ─── Sport color helper (v3 palette) ────────────────────────────────────────

function sportColor(colors: Palette, type: Activity['type']): string {
  switch (type) {
    case 'run': return colors.sportRun;
    case 'swim': return colors.sportSwim;
    case 'ride': return colors.sportRide;
    case 'walk': return colors.sportWalk;
    default: return colors.sportStrength;
  }
}

function sportTint(colors: Palette, type: Activity['type']): string {
  switch (type) {
    case 'run': return colors.sportRunTint;
    case 'swim': return colors.sportSwimTint;
    case 'ride': return colors.sportRideTint;
    case 'walk': return colors.sportWalkTint;
    default: return colors.sportStrengthTint;
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, paddingTop: t.space.lg, paddingBottom: t.space.section * 2, gap: t.space.section },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.space.screen, paddingTop: t.space.lg },
  backBtn: {
    height: t.size.touchMin,
    width: t.size.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.pill,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceSunken,
  },
  meta: { gap: t.space.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  section: { gap: t.space.md },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
  separator: { height: t.size.hairline, backgroundColor: t.colors.line },
  splitBtnRow: { flexDirection: 'row', gap: t.space.md, marginTop: t.space.sm },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center', alignSelf: 'flex-start' },
}));

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, opacity, size } = useTheme();
  const styles = useStyles();

  // ── Store ──────────────────────────────────────────────────────────────
  const stravaActivities = usePulseFitStore((s) => s.activities);
  const groupOverrides = usePulseFitStore((s) => s.groupOverrides);
  const addGroupOverride = usePulseFitStore((s) => s.addGroupOverride);
  const removeGroupOverride = usePulseFitStore((s) => s.removeGroupOverride);

  // ── Derived ────────────────────────────────────────────────────────────
  const derived = useSportDerived();

  // ── Map activities and build sessions ─────────────────────────────────
  const { session, activitiesById, allActivities } = useMemo(() => {
    const mapped = stravaActivities.map(stravaToActivity);
    const byId = new Map(mapped.map((a) => [a.id, a]));
    const { sessions } = groupSessions(mapped, groupOverrides);
    const resolved = id ? resolveSession(sessions, id) : undefined;
    return { session: resolved, activitiesById: byId, allActivities: mapped };
  }, [stravaActivities, groupOverrides, id]);

  // ── Session view ──────────────────────────────────────────────────────
  const view = useMemo(() => {
    if (!session) return undefined;
    return buildSessionView(session, activitiesById);
  }, [session, activitiesById]);

  // ── Race debrief ──────────────────────────────────────────────────────
  const mainActivityId = session?.activityIds[0];
  const raceId = mainActivityId ? derived.confirmedRaceMap.get(mainActivityId) : undefined;
  const raceDebrief = derived.raceDebrief(raceId);
  const raceSummary = derived.raceSummaryFor(raceId);

  // ── Highlight ─────────────────────────────────────────────────────────
  const mainActivity = mainActivityId ? activitiesById.get(mainActivityId) : undefined;
  const highlight = useMemo(
    () => (mainActivity ? derived.highlightFor(mainActivity) : null),
    [derived, mainActivity],
  );
  const comparison = useMemo(
    () => (mainActivity ? derived.comparisonFor(mainActivity) : null),
    [derived, mainActivity],
  );

  // ── Undo state for split/merge ────────────────────────────────────────
  const [undoMsg, setUndoMsg] = useState<string | null>(null);
  const [undoOverride, setUndoOverride] = useState<GroupOverride | null>(null);

  const handleSplit = () => {
    if (!session || session.activityIds.length < 2) return;
    session.activityIds.slice(1).forEach((actId) =>
      addGroupOverride({ type: 'split', activityId: actId }),
    );
    setUndoMsg('Séance séparée');
    setUndoOverride({ type: 'split', activityId: session.activityIds[1] });
  };

  const handleUndo = () => {
    if (!undoOverride || !session) return;
    session.activityIds.slice(1).forEach((actId) =>
      removeGroupOverride({ type: 'split', activityId: actId }),
    );
    setUndoMsg(null);
    setUndoOverride(null);
  };

  useEffect(() => {
    perfLog('/activity premier rendu');
  }, []);

  // ── Not found ─────────────────────────────────────────────────────────
  if (!session || !view) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: opacity.pressed }]}>
              <ChevronLeft color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
            </Pressable>
          </View>
          <View style={styles.content}>
            <EmptyState
              reason="noImport"
              title="Activité introuvable"
              body="Cette activité n'existe plus ou n'a pas été synchronisée."
              primary={{ label: 'Retour', onPress: () => router.back() }}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Splits (from main activity or single activity) ────────────────────
  const splitsActivity = mainActivity;
  const splits = splitsActivity?.splits ?? [];
  const showSplits = view.layout.showSplits && splits.length > 0;
  const paceUnit = view.sport === 'swim' ? '/100 m' : 'min/km';

  // ── Race debrief: decide what to show ─────────────────────────────────
  const isRace = raceDebrief !== undefined && raceDebrief.confirmed;
  const hasHr = view.avgHr !== undefined;
  const bands = raceDebrief?.bands ?? [];
  const showBands = isRace && bands.length > 0;
  const raceDistanceNote = raceDebrief?.distanceNote;

  // ── Hero override for race: elapsed time ──────────────────────────────
  const heroValue = isRace && raceDebrief?.timeSec !== undefined
    ? formatClock(raceDebrief.timeSec)
    : view.heroValue;
  const heroUnit = isRace ? undefined : view.heroUnit;

  // ── Caption for race ──────────────────────────────────────────────────
  const raceCaptionParts: string[] = [];
  if (isRace && raceDebrief) {
    if (raceDebrief.race.officialDistanceKm) {
      raceCaptionParts.push(`${formatKmNumber(raceDebrief.race.officialDistanceKm)}${NBSP}km officiels`);
    }
    if (raceDebrief.officialPaceSec !== undefined) {
      const m = Math.floor(raceDebrief.officialPaceSec / 60);
      const s = Math.round(raceDebrief.officialPaceSec % 60);
      raceCaptionParts.push(`${m}:${`${s}`.padStart(2, '0')}${NBSP}/km`);
    }
    const compRows = raceDebrief.comparison;
    if (compRows.length > 0) {
      const current = compRows.find((r) => r.current);
      if (current) {
        const rank = compRows.filter((r) => r.timeSec !== undefined).findIndex((r) => r.current) + 1;
        const total = compRows.filter((r) => r.timeSec !== undefined).length;
        if (total > 1) {
          raceCaptionParts.push(`${rank}e de tes ${total} semis`);
        }
      }
    }
  }
  const heroCaption = isRace
    ? raceCaptionParts.join(`${NBSP}·${NBSP}`)
    : view.heroCaption;

  // ── Strength note ─────────────────────────────────────────────────────
  const isStrength = view.sport === 'strength';

  // ── Effort pill ───────────────────────────────────────────────────────
  const effortLevel = deriveEffort(view, isStrength);

  return (
    <View style={styles.root} testID="activity-screen">
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header with back + source badge */}
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: opacity.pressed }]}>
            <ChevronLeft color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
          </Pressable>
          <View style={styles.badge}>
            <Text role="caption" weight="semibold" color="inkTertiary">{view.source}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* ── Meta line ──────────────────────────────────────────────── */}
          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <Text role="sub" color="inkSecondary">
                {view.dateLine}
                {view.timeLine ? `${NBSP}·${NBSP}${view.timeLine}` : ''}
              </Text>
              {view.groupLabel ? (
                <Text role="sub" color="inkSecondary">{`${NBSP}·${NBSP}${view.groupLabel}`}</Text>
              ) : null}
            </View>

            {/* Title + effort pill */}
            <View style={styles.titleRow}>
              <Text role="title">{isRace ? raceDebrief!.title : view.title}</Text>
              <EffortPill {...effortLevel} />
            </View>

            {/* Race: original name as quote */}
            {isRace && raceDebrief?.originalName ? (
              <Text role="sub" color="inkSecondary">{`« ${raceDebrief.originalName} »`}</Text>
            ) : null}

            {/* ── Hero ──────────────────────────────────────────────── */}
            <HeroMetric
              value={heroValue}
              unit={heroUnit}
              caption={heroCaption}
              metrics={view.metrics}
            />

            {/* GPS legend (race, shown once) */}
            {isRace && raceDistanceNote ? (
              <Text role="caption" color="inkTertiary">
                {gpsLegendFr(
                  raceDebrief!.race.measuredDistanceKm ?? 0,
                  raceDebrief!.race.officialDistanceKm,
                )}
              </Text>
            ) : null}

            {/* Strength FC note */}
            {isStrength && hasHr ? (
              <Text role="sub" color="inkSecondary">{STRENGTH_FC_NOTE}</Text>
            ) : null}
          </View>

          {/* ── Coach card (debrief or highlight) ─────────────────────── */}
          {isRace && raceDebrief?.pacing ? (
            <CoachCard
              kind="insight"
              verdict={raceDebrief.pacing.title}
              body={raceDebrief.pacing.summary}
              source="device"
            />
          ) : isRace && !hasHr ? (
            <CoachCard
              kind="insight"
              verdict="Tu as fini plus vite que tu n'as commencé."
              body={DEBRIEF_NO_FC}
              source="device"
            />
          ) : highlight ? (
            <CoachCard
              kind="insight"
              verdict={highlight.title}
              body={highlight.detail}
              source="device"
            />
          ) : null}

          {/* ── Race bands ("Ta course en quatre quarts") ─────────────── */}
          {showBands ? (
            <RaceBands
              title="Ta course en quatre quarts"
              bands={bands}
              averagePaceSec={raceDebrief!.averagePaceSec}
            />
          ) : null}

          {/* ── HR debrief (race with HR) ─────────────────────────────── */}
          {isRace && raceDebrief?.hr?.driftSentence ? (
            <Text role="sub" color="inkSecondary" testID="drift-sentence">
              {raceDebrief.hr.driftSentence}
            </Text>
          ) : null}

          {/* ── Grouped session ("La séance en trois temps") ──────────── */}
          {view.isGrouped ? (
            <View style={styles.section}>
              <SessionParts
                title="La séance en trois temps"
                summary={sessionSummary(session, view)}
                parts={view.parts}
                sportColor={sportColor(colors, view.sport)}
              />
              <View style={styles.splitBtnRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSplit}
                  style={styles.link}>
                  <Text role="sub" weight="semibold" style={{ textDecorationLine: 'underline' }}>
                    Séparer
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* ── Splits list ───────────────────────────────────────────── */}
          {showSplits ? (
            <View style={styles.card}>
              <SplitsList splits={splits} paceUnit={paceUnit} />
            </View>
          ) : null}

          {/* ── Comparison (non-race) ─────────────────────────────────── */}
          {comparison ? (
            <Text role="caption" color="inkTertiary">{comparison}</Text>
          ) : null}
        </ScrollView>

        {/* ── Undo toast ──────────────────────────────────────────────── */}
        <UndoToast
          visible={undoMsg !== null}
          message={undoMsg ?? ''}
          onUndo={handleUndo}
          onDismiss={() => { setUndoMsg(null); setUndoOverride(null); }}
        />
      </SafeAreaView>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sessionSummary(session: Session, view: SessionView): string {
  const parts: string[] = [];
  if (session.distanceM !== undefined) {
    parts.push(formatKm(session.distanceM / 1000));
  }
  parts.push(view.duration.main);
  return parts.join(`${NBSP}·${NBSP}`);
}

function deriveEffort(
  view: SessionView,
  isStrength: boolean,
): { level: EffortLevel } | { level: 'neutral'; label: string } {
  if (isStrength) return { level: 'neutral', label: 'Renfo' };
  if (!view.avgHr) return { level: 'neutral', label: 'Sans cardio' };
  // Simple heuristic based on session type — the real effort comes from core
  return { level: 'moderate' };
}
