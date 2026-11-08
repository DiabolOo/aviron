/**
 * Débrief de course (`212`) — empilé dans l'onglet Progrès.
 *
 * Affiche le graphique d'allure en 3 ou 4 segments (PaceSteps),
 * les temps numérotés (NumberedList) et un CoachCard « La prochaine fois ».
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { parseISODate } from '@/src/core/dates';
import { formatClock, formatSecAsClock, NBSP } from '@/src/core/sportFormat';
import type { PaceBand } from '@/src/core/training/engine';
import { makeStyles, useTheme } from '@/src/design';
import { useResolvedSession } from '@/src/screens/activity/useResolvedSession';
import { BackHeader } from '@/src/ui/BackHeader';
import { CoachCard } from '@/src/ui/CoachCard';
import { EmptyState } from '@/src/ui/EmptyState';
import { NumberedList, type NumberedItem } from '@/src/ui/NumberedList';
import { PaceSteps, type Step } from '@/src/ui/PaceSteps';
import { Text } from '@/src/ui/Text';
import { useSportDerived } from '@/src/ui/useRaces';
import { useTabBarInset } from '@/src/ui/useTabBarInset';

// ─── Helpers ───────────────────────────────────────────────────────────────

const BAND_NAMES = ['Départ', 'Milieu', 'Final', 'Dernier quart'] as const;

function bandTitle(band: PaceBand, idx: number, total: number): string {
  const name = total <= 3
    ? (BAND_NAMES[idx] ?? `Segment ${idx + 1}`)
    : `${BAND_NAMES[idx] ?? `Segment ${idx + 1}`}`;
  const range = `km${NBSP}${formatKmShort(band.fromKm)} à ${formatKmShort(band.toKm)}`;
  const pace = band.officialPaceSec !== undefined
    ? `${formatSecAsClock(band.officialPaceSec)}${NBSP}/km`
    : '';
  return [name, range, pace].filter(Boolean).join(`${NBSP}·${NBSP}`);
}

function formatKmShort(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return `${rounded}`.replace('.', ',');
}

/** « dim. 11 oct. 2026 · 1h53:09 » */
function debriefDateLine(dateISO: string, timeSec?: number): string {
  const d = parseISODate(dateISO);
  const dateLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const parts = [`Débrief${NBSP}·${NBSP}${dateLabel}`];
  if (timeSec !== undefined) parts.push(formatClock(timeSec));
  return parts.join(`${NBSP}·${NBSP}`);
}

// ─── Styles ────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.lg },
  meta: { gap: t.space.xs },
}));

// ─── Screen ────────────────────────────────────────────────────────────────

export function DebriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();

  const { session } = useResolvedSession(id);
  const derived = useSportDerived();
  const activityId = session?.activityIds[0];
  const raceId = activityId ? derived.confirmedRaceMap.get(activityId) : undefined;
  const debrief = derived.raceDebrief(raceId);

  // ── Pace steps data ──
  const paceSteps: Step[] = useMemo(() => {
    if (!debrief?.bands.length) return [];
    return debrief.bands.map((b) => ({
      fromKm: b.fromKm,
      toKm: b.toKm,
      value: b.officialPaceSec ?? 0,
    }));
  }, [debrief]);

  const hrSteps: Step[] | undefined = useMemo(() => {
    if (!debrief?.bands.length) return undefined;
    const hasHr = debrief.bands.some((b) => b.avgHr !== undefined);
    if (!hasHr) return undefined;
    return debrief.bands.map((b) => ({
      fromKm: b.fromKm,
      toKm: b.toKm,
      value: b.avgHr ?? 0,
    }));
  }, [debrief]);

  // ── Numbered items ──
  const numberedItems: NumberedItem[] = useMemo(() => {
    if (!debrief?.bands.length) return [];
    return debrief.bands.map((band, idx) => {
      const parts: string[] = [];
      // HR info if available
      if (band.avgHr !== undefined) {
        parts.push(`${band.avgHr}${NBSP}bpm`);
      }
      // Time info
      if (band.timeSec !== undefined) {
        const pace = band.officialPaceSec !== undefined
          ? `${formatSecAsClock(band.officialPaceSec)}${NBSP}/km`
          : '';
        if (pace) parts.push(pace);
      }

      return {
        id: `band-${idx}`,
        title: bandTitle(band, idx, debrief.bands.length),
        body: debrief.pacing?.extras[idx],
      };
    });
  }, [debrief]);

  // ── Axis labels ──
  const axis = useMemo(() => {
    if (!debrief?.bands.length) return [];
    const labels: string[] = [`km${NBSP}0`];
    const last = debrief.bands[debrief.bands.length - 1];
    if (debrief.bands.length > 2) {
      const mid = debrief.bands[Math.floor(debrief.bands.length / 2)];
      labels.push(`km${NBSP}${formatKmShort(mid.fromKm)}`);
    }
    labels.push(`km${NBSP}${formatKmShort(last.toKm)}`);
    return labels;
  }, [debrief]);

  // ── Markers ──
  const markers = useMemo(() => {
    if (!debrief?.bands.length) return [];
    return debrief.bands.map((b, idx) => ({
      km: (b.fromKm + b.toKm) / 2,
      label: `${idx + 1}`,
    }));
  }, [debrief]);

  const raceTitle = debrief?.title ?? 'Course';
  const hasHr = hrSteps !== undefined;
  const legend = hasHr
    ? `— allure${NBSP}↑${NBSP}plus vite${NBSP}${NBSP}···${NBSP}FC${NBSP}↑${NBSP}plus haute`
    : `↑${NBSP}plus vite`;
  const averageLabel = debrief?.averagePaceSec !== undefined
    ? `moy.${NBSP}${formatSecAsClock(debrief.averagePaceSec)}`
    : undefined;

  // ── Not found ──
  if (!debrief) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <BackHeader label="Progrès" onBack={() => router.back()} />
        </View>
        <View style={styles.content}>
          <EmptyState
            reason="noImport"
            title="Débrief introuvable"
            body="Cette course n'a pas été trouvée ou n'est plus confirmée."
            primary={{ label: 'Retour', onPress: () => router.back() }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="debrief-screen">
      <View style={styles.header}>
        <BackHeader label={raceTitle} onBack={() => router.back()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Surtitre + titre ── */}
        <View style={styles.meta}>
          <Text role="sub" color="inkSecondary">
            {debriefDateLine(debrief.race.date, debrief.timeSec)}
          </Text>
          <Text role="title">Ta course en trois temps</Text>
        </View>

        {/* ── Pace graph ── */}
        {paceSteps.length > 0 ? (
          <PaceSteps
            pace={paceSteps}
            hr={hrSteps}
            averageSec={debrief.averagePaceSec}
            legend={legend}
            averageLabel={averageLabel}
            axis={axis}
            markers={markers}
            accessibilityLabel={`Allure de ${raceTitle} en ${debrief.bands.length} segments`}
          />
        ) : null}

        {/* ── Numbered list ── */}
        {numberedItems.length > 0 ? (
          <NumberedList items={numberedItems} />
        ) : null}

        {/* ── Coach card "La prochaine fois" ── */}
        {debrief.pacing ? (
          <CoachCard
            kind="insight"
            label="La prochaine fois"
            verdict={debrief.pacing.summary}
            body={debrief.distanceNote?.detail}
            source="device"
          />
        ) : null}

      </ScrollView>
    </View>
  );
}
