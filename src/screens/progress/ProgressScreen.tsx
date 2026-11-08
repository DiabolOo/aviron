/**
 * Écran Progrès (`211`) — onglet « Progrès ».
 *
 * Affiche le volume d'entraînement par période (semaine, mois, année),
 * un histogramme WeekBars, un résumé par sport, la régularité, et la
 * liste des courses confirmées avec écart au record.
 */
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { addDaysISO, parseISODate, toISODate, weekDates, weekdayLabel } from '@/src/core/dates';
import { formatDuration } from '@/src/core/format';
import { formatClock, formatSecAsClock, NBSP } from '@/src/core/sportFormat';
import { groupByMonth, monthTotals, selectWeek, shiftWeek, weekStartISO } from '@/src/core/sportWeek';
import type { StravaActivity } from '@/src/core/types';
import { makeStyles, useTheme } from '@/src/design';
import { openDebrief } from '@/src/ui/nav';
import { EmptyState } from '@/src/ui/EmptyState';
import { HeroMetric } from '@/src/ui/HeroMetric';
import { RaceList, type RaceRow } from '@/src/ui/RaceList';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { SegmentedControl } from '@/src/ui/SegmentedControl';
import { Skeleton } from '@/src/ui/Skeleton';
import { Text } from '@/src/ui/Text';
import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';
import { useTabBarInset } from '@/src/ui/useTabBarInset';
import { WeekBars, type Bar } from '@/src/ui/WeekBars';
import { useRaceLists } from '@/src/ui/useRaces';

// ─── Constants ─────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'year';

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

const SPORT_LABEL: Record<string, string> = {
  run: 'Course',
  ride: 'Vélo',
  walk: 'Marche',
  swim: 'Nage',
  strength: 'Muscu',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** « 4h50 » from seconds. */
function durationLabel(sec: number): string {
  return formatDuration(sec / 60);
}

/** « Mai 2026 » */
function monthLabel(key: string): string {
  const d = parseISODate(`${key}-01`);
  const raw = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** « 2 – 8 nov. » */
function weekPeriodLabel(startISO: string): string {
  const start = parseISODate(startISO);
  const end = parseISODate(addDaysISO(startISO, 6));
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) });
  const endLabel = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${startLabel}${NBSP}–${NBSP}${endLabel}`;
}

/** Sport breakdown legend: « Course 2 h 25 · nage 1 h 18 · muscu 1 h 07 » */
function sportBreakdown(items: readonly StravaActivity[]): string {
  const bySport = new Map<string, number>();
  for (const a of items) {
    bySport.set(a.type, (bySport.get(a.type) ?? 0) + (a.durationMin ?? 0));
  }
  return [...bySport.entries()]
    .filter(([, min]) => min > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([type, min]) => `${SPORT_LABEL[type] ?? type}${NBSP}${formatDuration(min)}`)
    .join(`${NBSP}·${NBSP}`);
}

// ─── Styles ────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.xl },
  segment: { paddingTop: t.space.md },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.space.md,
    paddingTop: t.space.lg,
  },
  navBtn: {
    minWidth: t.size.touchMin,
    minHeight: t.size.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: t.space.md },
  skeletons: { gap: t.space.section },
}));

// ─── Screen ────────────────────────────────────────────────────────────────

export function ProgressScreen() {
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();

  const dataReady = usePulseFitStore((s) => s.dataReady);
  const activities = usePulseFitStore((s) => s.activities);
  const showSkeleton = useDelayedSkeleton(!dataReady);

  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);

  const raceLists = useRaceLists();

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toISODate(now), [now]);

  // ── Month view data ──
  const monthData = useMemo(() => {
    if (period !== 'month') return null;
    const months = groupByMonth(activities);
    const idx = Math.min(-offset, 0) + months.length - 1 + offset;
    const currentMonth = months[idx];
    if (!currentMonth) return null;

    const totals = monthTotals(currentMonth.items);
    const sessionCount = currentMonth.items.length;

    // Build 4–5 week bars for this month
    const firstDay = parseISODate(`${currentMonth.key}-01`);
    const bars: Bar[] = [];
    let weekStart = weekStartISO(firstDay);
    const monthEnd = currentMonth.key + '-31';
    while (weekStart <= monthEnd && bars.length < 6) {
      const ws = selectWeek(activities, weekStart);
      const monthActivities = ws.activities.filter((a) => a.date.startsWith(currentMonth.key));
      const durationMin = monthActivities.reduce((sum, a) => sum + (a.durationMin ?? 0), 0);
      const d = parseISODate(weekStart);
      bars.push({
        id: weekStart,
        label: `${d.getDate()}`,
        value: durationMin,
        valueLabel: durationMin > 0 ? formatDuration(durationMin) : undefined,
        highlight: weekStart <= today && addDaysISO(weekStart, 6) >= today,
      });
      weekStart = shiftWeek(weekStart, 1);
    }

    // Regularity: count of weeks with at least one activity
    const activeWeeks = bars.filter((b) => b.value > 0).length;
    const totalWeeks = bars.length;
    const regularity = activeWeeks > 0
      ? `${activeWeeks}${NBSP}${activeWeeks > 1 ? 'semaines actives' : 'semaine active'} sur${NBSP}${totalWeeks}`
      : undefined;

    return {
      label: monthLabel(currentMonth.key),
      key: currentMonth.key,
      durationSec: totals.durationSec,
      sessionCount,
      bars,
      sportBreakdown: sportBreakdown(currentMonth.items),
      regularity,
      canPrev: idx > 0,
      canNext: idx < months.length - 1,
    };
  }, [period, offset, activities, today]);

  // ── Week view data ──
  const weekData = useMemo(() => {
    if (period !== 'week') return null;
    const start = shiftWeek(weekStartISO(now), offset);
    const week = selectWeek(activities, start);
    const dates = weekDates(parseISODate(start));

    const bars: Bar[] = dates.map((iso) => {
      const dayActs = week.activities.filter((a) => a.date === iso);
      const durationMin = dayActs.reduce((sum, a) => sum + (a.durationMin ?? 0), 0);
      return {
        id: iso,
        label: weekdayLabel(iso).charAt(0),
        value: durationMin,
        valueLabel: durationMin > 0 ? formatDuration(durationMin) : undefined,
        highlight: iso === today,
      };
    });

    return {
      label: weekPeriodLabel(start),
      durationSec: week.durationSec,
      sessionCount: week.count,
      bars,
      sportBreakdown: sportBreakdown(week.activities),
      canPrev: true,
      canNext: offset < 0,
    };
  }, [period, offset, activities, now, today]);

  // ── Year view data ──
  const yearData = useMemo(() => {
    if (period !== 'year') return null;
    const year = new Date().getFullYear() + offset;
    const yearStr = `${year}`;
    const yearActivities = activities.filter((a) => a.date.startsWith(yearStr));
    const months = groupByMonth(yearActivities);

    const bars: Bar[] = Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${`${i + 1}`.padStart(2, '0')}`;
      const month = months.find((m) => m.key === key);
      const durationMin = month
        ? month.items.reduce((sum, a) => sum + (a.durationMin ?? 0), 0)
        : 0;
      const d = new Date(year, i);
      return {
        id: key,
        label: d.toLocaleDateString('fr-FR', { month: 'narrow' }),
        value: durationMin,
        valueLabel: durationMin > 0 ? formatDuration(durationMin) : undefined,
        highlight: key === today.slice(0, 7),
      };
    });

    const totalSec = yearActivities.reduce((sum, a) => sum + (a.durationMin ?? 0) * 60, 0);

    return {
      label: yearStr,
      durationSec: totalSec,
      sessionCount: yearActivities.length,
      bars,
      sportBreakdown: sportBreakdown(yearActivities),
      canPrev: true,
      canNext: offset < 0,
    };
  }, [period, offset, activities, today]);

  const data = period === 'month' ? monthData : period === 'week' ? weekData : yearData;

  // ── Race rows ──
  const raceRows: RaceRow[] = useMemo(() => {
    const confirmed = raceLists.confirmed;
    if (confirmed.length === 0) return [];

    // Find the best (minimum) time for each distance group
    const bestByDist = new Map<number, number>();
    for (const r of confirmed) {
      if (r.timeSec === undefined) continue;
      const dist = r.officialDistanceKm;
      const best = bestByDist.get(dist);
      if (!best || r.timeSec < best) bestByDist.set(dist, r.timeSec);
    }

    return confirmed.map((r) => {
      const d = parseISODate(r.date);
      const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      const city = r.startCity ?? '';
      const title = city ? `${dateLabel}${NBSP}·${NBSP}${city}` : dateLabel;

      const paceParts: string[] = [];
      if (r.timeSec !== undefined && r.officialDistanceKm > 0) {
        const paceSec = r.timeSec / r.officialDistanceKm;
        paceParts.push(`${formatSecAsClock(paceSec)}${NBSP}/km`);
      }
      // RaceCandidate doesn't carry avgHr; we skip the "sans cardio" note here

      const time = r.timeSec !== undefined ? formatClock(r.timeSec) : '–';
      const best = bestByDist.get(r.officialDistanceKm);
      const isRecord = r.timeSec !== undefined && r.timeSec === best;
      const gap = !isRecord && r.timeSec !== undefined && best !== undefined
        ? `+${formatClock(r.timeSec - best)}`
        : undefined;

      return {
        id: r.id,
        title,
        sub: paceParts.length > 0 ? paceParts.join(`${NBSP}·${NBSP}`) : undefined,
        time,
        gap,
        record: isRecord,
        onPress: r.activityId ? () => openDebrief(r.activityId!) : undefined,
      };
    });
  }, [raceLists.confirmed]);

  const isEmpty = activities.length === 0;
  const hasFewSessions = activities.length < 6;

  // ── Skeleton ──
  if (showSkeleton) {
    return (
      <View style={styles.root} testID="progress-loading">
        <View style={[styles.content, { paddingTop: space.xl }]}>
          <View style={styles.skeletons}>
            <Skeleton role="title" />
            <Skeleton role="body" />
            <Skeleton role="body" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="progress-screen">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}>

        {/* ── En-tête ── */}
        <View style={styles.header}>
          <ScreenHeader title="Progrès" subtitle="Où tu en es, sur la durée." />
        </View>

        {/* ── Période ── */}
        <View style={styles.segment}>
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(v) => { setPeriod(v); setOffset(0); }}
          />
        </View>

        {/* ── Empty state for new users ── */}
        {isEmpty ? (
          <EmptyState
            reason="firstSessions"
            title="Ta progression arrive."
            body="À la troisième séance, je te montre ta régularité. À la sixième, tes premiers progrès."
          />
        ) : hasFewSessions ? (
          <EmptyState
            reason="firstSessions"
            title="Ta progression arrive."
            body="À la troisième séance, je te montre ta régularité. À la sixième, tes premiers progrès."
            progress={activities.length < 3
              ? { done: activities.map((a) => a.name ?? 'Séance'), total: 3, remaining: `Encore${NBSP}${3 - activities.length}${NBSP}séances` }
              : { done: activities.slice(0, activities.length).map((a) => a.name ?? 'Séance'), total: 6, remaining: `Encore${NBSP}${6 - activities.length}${NBSP}séances` }
            }
          />
        ) : null}

        {/* ── Period card ── */}
        {data && !isEmpty ? (
          <View style={styles.section}>
            {/* Period label with navigation */}
            <View style={styles.periodRow}>
              <Text
                role="sub"
                weight="semibold"
                color={data.canPrev ? 'ink' : 'inkTertiary'}
                onPress={data.canPrev ? () => setOffset((o) => o - 1) : undefined}
                accessibilityRole="button"
                accessibilityLabel="Période précédente"
                testID="period-prev">
                {'‹'}
              </Text>
              <Text role="sub" weight="semibold" testID="period-label">{data.label}</Text>
              <Text
                role="sub"
                weight="semibold"
                color={data.canNext ? 'ink' : 'inkTertiary'}
                onPress={data.canNext ? () => setOffset((o) => o + 1) : undefined}
                accessibilityRole="button"
                accessibilityLabel="Période suivante"
                testID="period-next">
                {'›'}
              </Text>
            </View>

            {/* Hero: total duration */}
            <HeroMetric
              value={durationLabel(data.durationSec)}
              caption={`d'entraînement${NBSP}·${NBSP}${data.sessionCount}${NBSP}${data.sessionCount > 1 ? 'séances' : 'séance'}`}
            />

            {/* WeekBars */}
            {data.bars.length > 0 ? (
              <WeekBars
                bars={data.bars}
                legend={data.sportBreakdown || undefined}
                accessibilityLabel={`Volume d'entraînement, ${data.label}`}
              />
            ) : null}

            {/* Regularity (month only) */}
            {period === 'month' && monthData?.regularity ? (
              <Text role="sub" color="inkSecondary">{monthData.regularity}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Race list ── */}
        {raceRows.length > 0 ? (
          <RaceList
            title="Tes semis"
            caption="écart à ton record"
            races={raceRows}
          />
        ) : null}

      </ScrollView>
    </View>
  );
}
