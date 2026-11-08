/**
 * Écran Semaine (`104`) — prévu et fait, jour par jour.
 *
 * La semaine courante montre les séances prévues (du plan) et les activités faites.
 * Les séances prévues ne sont pas touchables (Q6). Les activités faites naviguent vers le détail.
 * La section « Avant » liste les semaines passées qui ont des données.
 */
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { useProposalStore } from '@/lib/proposalStore';
import { toISODate, weekDates, weekdayLabel } from '@/src/core/dates';
import { isSportProposal } from '@/src/screens/coach/coachEngine';
import { selectWeek, shiftWeek, weekStartISO } from '@/src/core/sportWeek';
import { formatSecAsClock, NBSP } from '@/src/core/sportFormat';
import { athleteProfileFrom } from '@/src/core/training/level';
import type { WorkoutSession as PlannedSession } from '@/src/core/types';
import { makeStyles, useTheme } from '@/src/design';
import { openActivity, openWeek } from '@/src/ui/nav';
import { PastWeekRow } from '@/src/ui/PastWeekRow';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Skeleton } from '@/src/ui/Skeleton';
import { Text } from '@/src/ui/Text';
import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';
import { useTabBarInset } from '@/src/ui/useTabBarInset';
import { WeekList, type DayRowProps } from '@/src/ui/WeekList';
import type { EffortPillProps } from '@/src/ui/EffortPill';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** « 2 – 8 nov. » */
function formatPeriod(startISO: string, endISO: string): string {
  const start = new Date(startISO + 'T00:00');
  const end = new Date(endISO + 'T00:00');
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) });
  const endLabel = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${startLabel}${NBSP}–${NBSP}${endLabel}`;
}

/** « J-160 » : jours restants avant la date objectif. */
function countdown(goalDate: string | undefined, today: string): string | undefined {
  if (!goalDate) return undefined;
  const g = new Date(goalDate + 'T00:00');
  const t = new Date(today + 'T00:00');
  const days = Math.round((g.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return undefined;
  return `J-${days}`;
}

/** Effort pill pour une séance prévue, selon son kind. */
function effortForKind(kind: PlannedSession['kind']): EffortPillProps | undefined {
  if (kind === 'rest') return undefined;
  if (kind === 'strength') return { level: 'neutral', label: 'Renfo' };
  return { level: 'easy', scale: 'planned' };
}

/** « Lun 2 » */
function dayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00');
  return `${weekdayLabel(iso)}${NBSP}${d.getDate()}`;
}

/** Résumé d'une semaine passée : « 1 sortie, 15 min » ou « Rien d'importé ». */
function weekSummaryText(count: number, durationSec: number): string {
  if (count === 0) return 'Rien d’importé';
  const word = count > 1 ? 'sorties' : 'sortie';
  return `${count}${NBSP}${word}, ${formatSecAsClock(durationSec)}`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.xl },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: t.space.md,
  },
  skeletons: { gap: t.space.section },
  pastTitle: { paddingTop: t.space.md },
}));

// ─── Screen ─────────────────────────────────────────────────────────────────

export function WeekScreen() {
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();

  const dataReady = usePulseFitStore((s) => s.dataReady);
  const plannedSessions = usePulseFitStore((s) => s.sessions) as PlannedSession[];
  const activities = usePulseFitStore((s) => s.activities);
  const profile = usePulseFitStore((s) => s.profile);
  const program = usePulseFitStore((s) => s.activeWorkoutProgram);
  const proposals = useProposalStore((s) => s.proposals);

  const showSkeleton = useDelayedSkeleton(!dataReady);

  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toISODate(now), [now]);
  const currentStart = useMemo(() => weekStartISO(now), [now]);
  const athleteProfile = useMemo(() => athleteProfileFrom(profile), [profile]);

  // ── Phase et objectif ──
  const currentPhase = useMemo(() => {
    if (!program?.milestones.length) return undefined;
    const past = program.milestones
      .filter((m) => m.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return past[0]?.title;
  }, [program, today]);

  const goalLabel = profile.athleticGoal?.targetName;
  const goalDate = profile.athleticGoal?.targetDate;
  const goalCountdown = useMemo(() => countdown(goalDate, today), [goalDate, today]);

  // ── Propositions en attente sur les jours de la semaine ──
  const proposalsByDate = useMemo(() => {
    const map = new Map<string, string>();
    proposals
      .filter((p) => p.status === 'pending' && isSportProposal(p))
      .forEach((p) => {
        const date = p.payload?.date;
        if (typeof date === 'string') {
          map.set(date, `Le coach propose ${p.title.split(':').pop()?.trim() ?? p.title}`);
        }
      });
    return map;
  }, [proposals]);

  // ── Semaine courante : 7 jours ──
  const currentWeek = useMemo(() => selectWeek(activities, currentStart), [activities, currentStart]);

  const dayRows: DayRowProps[] = useMemo(() => {
    const dates = weekDates(now);
    const isBeginnerLevel = athleteProfile.level === 'beginner';

    return dates.map((iso) => {
      const session = plannedSessions.find((s) => s.date === iso && !s.skipped);
      const activity = currentWeek.activities.find((a) => a.date === iso);
      const isToday = iso === today;
      const isRest = session?.kind === 'rest' || (!session && !activity);
      const isDone = session?.completed || !!activity;

      const title = session?.title ?? (activity?.name ?? 'Repos');
      const sub = isToday ? 'Aujourd’hui' : undefined;
      const proposal = proposalsByDate.get(iso);

      return {
        id: iso,
        day: dayLabel(iso),
        title,
        sub,
        proposal,
        effort: session ? effortForKind(session.kind) : undefined,
        rest: isRest,
        today: isToday,
        check: isBeginnerLevel && !isRest ? (isDone ? 'done' : 'open') : undefined,
        onPress: isDone && activity ? () => openActivity(activity.id) : undefined,
      };
    });
  }, [now, today, plannedSessions, currentWeek.activities, athleteProfile.level, proposalsByDate]);

  // ── Semaines passées ──
  const pastWeeks = useMemo(() => {
    const weeks: { start: string; end: string; count: number; durationSec: number; detail: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const start = shiftWeek(currentStart, -i);
      const summary = selectWeek(activities, start);
      if (summary.count === 0 && i > 2) continue; // ne pas montrer les semaines anciennes vides au-delà de 2
      const detail = summary.count > 0
        ? summary.activities
            .slice(0, 1)
            .map((a) => {
              const dayLine = new Date(a.date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
              const cap = dayLine.charAt(0).toUpperCase() + dayLine.slice(1);
              const parts = [cap];
              if (a.name) parts.push(a.name.toLowerCase());
              if (a.distanceKm) parts.push(`${a.distanceKm.toFixed(1)}${NBSP}km`);
              return parts.join(`${NBSP}·${NBSP}`);
            })
            .join('')
        : 'Rien d’importé';
      weeks.push({
        start: summary.start,
        end: summary.end,
        count: summary.count,
        durationSec: summary.durationSec,
        detail,
      });
    }
    return weeks;
  }, [currentStart, activities]);

  // ── Skeleton ──
  if (showSkeleton) {
    return (
      <View style={styles.root} testID="week-loading">
        <View style={[styles.content, { paddingTop: space.xl }]}>
          <View style={styles.skeletons}>
            <Skeleton role="title" />
            <Skeleton role="body" />
            <Skeleton role="body" />
            <Skeleton role="body" />
          </View>
        </View>
      </View>
    );
  }

  const periodLabel = formatPeriod(currentWeek.start, currentWeek.end);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}
        testID="week-scroll">

        {/* ── En-tête ── */}
        <View style={styles.header}>
          <ScreenHeader title="Semaine" subtitle="Prévu et fait, jour par jour." />
        </View>

        {/* ── Période et objectif ── */}
        <View style={styles.periodRow}>
          <Text role="sub" weight="semibold" color="inkSecondary">
            {currentPhase ? `${periodLabel}${NBSP}·${NBSP}${currentPhase}` : periodLabel}
          </Text>
          {goalLabel && goalCountdown ? (
            <Text role="sub" color="inkTertiary">
              {`${goalLabel}, ${goalCountdown}`}
            </Text>
          ) : null}
        </View>

        {/* ── Semaine courante ── */}
        <WeekList days={dayRows} />

        {/* ── Semaines passées ── */}
        {pastWeeks.length > 0 ? (
          <View>
            <Text role="sub" weight="semibold" color="inkSecondary" style={styles.pastTitle}>
              Avant
            </Text>
            {pastWeeks.map((w) => (
              <PastWeekRow
                key={w.start}
                title={`${formatPeriod(w.start, w.end)}${w.count > 0 ? `${NBSP}·${NBSP}${weekSummaryText(w.count, w.durationSec)}` : ''}`}
                detail={w.detail}
                onPress={() => openWeek(w.start)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
