import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { evaluateInsights, rankInsights } from '@/src/core/training/insights/evaluate';
import type { InsightContext } from '@/src/core/training/insights/types';
import type { AthleteProfile } from '@/src/core/training/types';
import { makeStyles, textStyle, useTheme } from '@/src/design';
import { CoachCard, type CoachCardProps, type CoachSource } from '@/src/ui/CoachCard';
import { EmptyState } from '@/src/ui/EmptyState';
import { SessionCard, type SessionStatus } from '@/src/ui/SessionCard';
import { Skeleton } from '@/src/ui/Skeleton';
import { Text } from '@/src/ui/Text';
import { UndoToast } from '@/src/ui/UndoToast';
import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';
import { useRaceInsights } from '@/src/ui/useRaces';
import { useTabBarInset } from '@/src/ui/useTabBarInset';
import { sportDerived } from '@/src/ui/sportDerived';

import { PostponeSheet } from './PostponeSheet';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTodayHeader(date: Date): string {
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Phase courante du programme (milestone dont la date est passée ou actuelle). */
function currentPhase(
  program: { milestones: { title: string; date: string }[] } | undefined,
  today: string,
): string | undefined {
  if (!program?.milestones.length) return undefined;
  const past = program.milestones
    .filter((m) => m.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  return past[0]?.title;
}

/** Mapper source d'insight (schemas) → source CoachCard (ui). */
function insightToCoachSource(source: string): CoachSource {
  if (source === 'coach') return 'ai';
  return 'device';
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { gap: t.space.sm, paddingTop: t.space.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  avatar: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...textStyle('sub', 'semibold'), color: t.colors.ink },
  skeletons: { gap: t.space.section },
}));

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const { colors, space } = useTheme();
  const styles = useStyles();
  const tabBarInset = useTabBarInset();

  // ── store ──
  const dataReady = usePulseFitStore((s) => s.dataReady);
  const firstName = usePulseFitStore((s) => s.profile.firstName);
  const sessions = usePulseFitStore((s) => s.sessions);
  const activities = usePulseFitStore((s) => s.activities);
  const program = usePulseFitStore((s) => s.activeWorkoutProgram);
  const profile = usePulseFitStore((s) => s.profile);
  const confirmedRaceIds = usePulseFitStore((s) => s.confirmedRaceIds);
  const rejectedRaceIds = usePulseFitStore((s) => s.rejectedRaceIds);
  const raceNames = usePulseFitStore((s) => s.raceNames);
  const goal = usePulseFitStore((s) => s.profile.athleticGoal);
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const uncompleteSession = usePulseFitStore((s) => s.uncompleteSession);
  const moveSession = usePulseFitStore((s) => s.moveSession);
  const confirmRace = usePulseFitStore((s) => s.confirmRace);
  const rejectRace = usePulseFitStore((s) => s.rejectRace);

  // ── dates ──
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toISODate(now), [now]);
  const headerDate = useMemo(() => formatTodayHeader(now), [now]);
  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const phase = useMemo(() => currentPhase(program, today), [program, today]);

  // ── loading ──
  const showSkeleton = useDelayedSkeleton(!dataReady);

  // ── today's session ──
  const todaySession = useMemo(
    () => sessions.find((s) => s.date === today),
    [sessions, today],
  );

  // ── undo state ──
  const [undoState, setUndoState] = useState<{ message: string; sessionId: string; action: 'validate' | 'postpone'; previousDate?: string } | null>(null);

  const dismissUndo = useCallback(() => setUndoState(null), []);
  const handleUndo = useCallback(() => {
    if (!undoState) return;
    if (undoState.action === 'validate') {
      uncompleteSession(undoState.sessionId);
    } else if (undoState.previousDate) {
      moveSession(undoState.sessionId, undoState.previousDate);
    }
    setUndoState(null);
  }, [undoState, uncompleteSession, moveSession]);

  // ── validate ──
  const handleValidate = useCallback(() => {
    if (!todaySession) return;
    completeSession(todaySession.id);
    setUndoState({ message: 'Séance validée', sessionId: todaySession.id, action: 'validate' });
  }, [todaySession, completeSession]);

  // ── postpone ──
  const [postponeVisible, setPostponeVisible] = useState(false);
  const handlePostpone = useCallback(() => setPostponeVisible(true), []);
  const handlePostponeChoice = useCallback(
    (targetDate: string | null) => {
      setPostponeVisible(false);
      if (!todaySession || targetDate === null) return;
      const previousDate = todaySession.date;
      moveSession(todaySession.id, targetDate);
      setUndoState({ message: 'Séance reportée', sessionId: todaySession.id, action: 'postpone', previousDate });
    },
    [todaySession, moveSession],
  );

  // ── session card status ──
  const sessionStatus: SessionStatus = todaySession?.completed ? 'done' : 'planned';

  // ── insights ──
  const derived = useMemo(
    () => sportDerived({ stravaActivities: activities, confirmedIds: confirmedRaceIds, rejectedIds: rejectedRaceIds, names: raceNames, goal }),
    [activities, confirmedRaceIds, rejectedRaceIds, raceNames, goal],
  );

  const athleteProfile: AthleteProfile = useMemo(() => ({
    ageYears: profile.ageYears,
    sex: profile.sex,
    weightKg: profile.weightKg,
    mainSport: profile.mainSport,
    maxHr: profile.maxHr,
    hasHrDevice: undefined,
    athleticGoal: profile.athleticGoal,
    level: 'beginner',
  }), [profile]);

  const insights = useMemo(() => {
    if (!dataReady || derived.activities.length === 0) return [];
    const ctx: InsightContext = {
      today,
      activities: derived.activities,
      profile: athleteProfile,
      races: derived.races,
      confirmedIds: derived.confirmedIds,
    };
    return rankInsights(evaluateInsights(ctx), { max: 3 });
  }, [dataReady, today, derived, athleteProfile]);

  // ── race insights (confirm_race question) ──
  const raceInsights = useRaceInsights();

  // ── confirm race state (local) ──
  const [raceAnswer, setRaceAnswer] = useState<string | undefined>(undefined);

  const handleRaceConfirm = useCallback(
    (choiceId: string) => {
      setRaceAnswer(choiceId);
      if (!raceInsights.confirm) return;
      if (choiceId === 'yes') {
        confirmRace(raceInsights.confirm.raceId, raceInsights.confirm.suggestedName);
      } else {
        rejectRace(raceInsights.confirm.raceId);
      }
    },
    [raceInsights.confirm, confirmRace, rejectRace],
  );

  // ── build coach cards (non-confirm_race) ──
  const coachCards: CoachCardProps[] = useMemo(() => {
    const cards: CoachCardProps[] = [];

    // Regular insights (exclude confirm_race, handled separately)
    for (const insight of insights.filter((i) => i.ruleId !== 'confirm_race')) {
      cards.push({
        kind: 'insight',
        verdict: insight.title,
        body: insight.message,
        source: insightToCoachSource(insight.source),
      });
    }

    return cards;
  }, [insights]);

  // ── session instruction ──
  const sessionInstruction = useMemo(() => {
    if (!todaySession) return '';
    const parts: string[] = [];
    if (todaySession.subtitle) parts.push(todaySession.subtitle);
    return parts.join('. ') || todaySession.title;
  }, [todaySession]);

  // ── render ──
  if (showSkeleton) {
    return (
      <View style={styles.root} testID="today-loading">
        <View style={[styles.content, { paddingTop: space.xl }]}>
          <View style={styles.skeletons}>
            <Skeleton role="caption" />
            <Skeleton role="title" />
            <Skeleton role="body" />
            <Skeleton role="body" />
            <Skeleton role="body" />
          </View>
        </View>
      </View>
    );
  }

  const hasData = activities.length > 0 || sessions.length > 0;
  const hasPlan = sessions.length > 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.haloTop, colors.haloBottom]}
        style={styles.halo}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}
        testID="today-scroll">
        {/* ── En-tête ── */}
        <View style={styles.header}>
          <Text role="caption" weight="semibold" color="inkSecondary">
            {phase ? `${headerDate} · ${phase}` : headerDate}
          </Text>
          <View style={styles.headerRow}>
            <Text role="title">{`${greeting}, ${firstName}`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le profil"
              hitSlop={4}
              onPress={() => router.push('/profile')}
              style={styles.avatar}
              testID="avatar-button">
              <Text role="sub" weight="semibold" style={styles.initial}>{firstName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Séance du jour ── */}
        {!hasData ? (
          <EmptyState
            reason="firstDay"
            title="Bienvenue dans PulseFit."
            body="Connecte une montre ou importe tes activités pour que le coach te connaisse."
            primary={{ label: 'Configurer', onPress: () => router.push('/profile') }}
          />
        ) : !hasPlan ? (
          <EmptyState
            reason="noPlan"
            title="Pas encore de plan."
            body="Dis au coach ce que tu prépares, il construira ton programme."
            primary={{ label: 'Parler au coach', onPress: () => router.push('/(tabs)/coach') }}
          />
        ) : todaySession ? (
          <SessionCard
            eyebrow="Séance du jour"
            title={todaySession.title}
            effort={{ level: todaySession.kind === 'rest' ? 'easy' : 'moderate' }}
            instruction={sessionInstruction}
            status={sessionStatus}
            onValidate={handleValidate}
            onPostpone={handlePostpone}
            onUndo={handleUndo}
          />
        ) : (
          <EmptyState
            reason="restWeek"
            title={`Rien de pr\u00e9vu aujourd\u2019hui.`}
            body="Profite de ta journée de repos, tu reprends bientôt."
          />
        )}

        {/* ── Cartes coach ── */}
        {raceInsights.confirm ? (
          <CoachCard
            kind="question"
            body={`C\u2019est une course\u00a0? ${raceInsights.confirm.suggestedName}`}
            choices={[
              { id: 'yes', label: 'Oui, c\u2019est une course' },
              { id: 'no', label: 'Non, un entra\u00eenement' },
            ]}
            selected={raceAnswer}
            onChoose={handleRaceConfirm}
            source="device"
            label="Ton coach"
          />
        ) : null}

        {coachCards.map((card, i) => (
          <CoachCard key={`insight-${i}`} {...card} />
        ))}

        {/* ── Proposition en attente (placeholder, store non câblé) ── */}
        {/* ProposalCard sera affiché ici quand le store gérera les propositions */}
      </ScrollView>

      <PostponeSheet
        visible={postponeVisible}
        today={today}
        sessions={sessions}
        onChoice={handlePostponeChoice}
        onClose={() => setPostponeVisible(false)}
      />

      <UndoToast
        visible={undoState !== null}
        message={undoState?.message ?? ''}
        onUndo={handleUndo}
        onDismiss={dismissUndo}
        bottomInset={tabBarInset}
      />
    </View>
  );
}
