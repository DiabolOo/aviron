/**
 * Écran Aujourd'hui — règles de nommage dans ce fichier :
 *   PlannedSession = WorkoutSession (séance prévue dans le plan).
 *   Session         = src/core/training/sessions (séance regroupée depuis les activités).
 * Le reste du code base utilise encore "WorkoutSession" ; la migration est signalée en commentaire.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import type { Proposal } from '@/src/core/schemas';
import { toISODate, weekDates, weekdayLabel } from '@/src/core/dates';
import { sessionRepere } from '@/src/core/training/hrGuidance';
import { evaluateInsights, rankInsights } from '@/src/core/training/insights/evaluate';
import type { InsightContext } from '@/src/core/training/insights/types';
import { athleteProfileFrom, sessionCardLabels } from '@/src/core/training/level';
import type { AthleteProfile } from '@/src/core/training/types';
import type { WorkoutSession as PlannedSession } from '@/src/core/types';
import { makeStyles, useTheme } from '@/src/design';
import { CoachCard, type CoachCardProps, type CoachSource } from '@/src/ui/CoachCard';
import { DayDots, type DayDot } from '@/src/ui/DayDots';
import { EmptyState } from '@/src/ui/EmptyState';
import { ListCard } from '@/src/ui/ListCard';
import { openAgent } from '@/src/ui/agentDraft';
import { openActivity } from '@/src/ui/nav';
import { ProposalCard } from '@/src/ui/ProposalCard';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
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
  if (hour < 18) return 'Bon apr\u00e8s-midi';
  return 'Bonsoir';
}

/** Construit les DayDots de la semaine courante pour la carte « Ta semaine » (débutant, maquette 105). */
function buildWeekDots(today: string, plannedSessions: readonly PlannedSession[]): DayDot[] {
  const dates = weekDates();
  return dates.map((iso) => {
    const session = plannedSessions.find((s) => s.date === iso && !s.skipped);
    const done = session?.completed === true;
    const isToday = iso === today;
    return {
      id: iso,
      label: weekdayLabel(iso).charAt(0),
      state: done ? 'done' : isToday ? 'today' : session ? 'empty' : ('empty' as const),
    };
  });
}

/** Phase courante du programme (jalon dont la date est pass\u00e9e ou actuelle). */
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

/** Mapper source d'insight (schemas base) → CoachSource (ui). */
function insightToCoachSource(source: string): CoachSource {
  if (source === 'coach') return 'ai';
  return 'device';
}

/** Mapper source de proposition → source ProposalCard. */
function proposalToCardSource(source: Proposal['source']): 'ai' | 'device' {
  return source === 'nutrition' ? 'device' : 'ai';
}

/** Confidence number → ProposalCard confidence label. */
function proposalConfidence(c: number): 'high' | 'medium' | 'low' {
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.xl },
  skeletons: { gap: t.space.section },
  weekCard: { paddingVertical: t.space.md },
  weekTitle: { paddingBottom: t.space.md },
}));

// ─── Screen ─────────────────────────────────────────────────────────────────

export function TodayScreen() {
  const { colors, space } = useTheme();
  const styles = useStyles();
  const tabBarInset = useTabBarInset();

  // ── store principal ──
  const dataReady = usePulseFitStore((s) => s.dataReady);
  const firstName = usePulseFitStore((s) => s.profile.firstName);
  const unavailableDates = usePulseFitStore((s) => s.profile.unavailableDates);
  // NOTE: "sessions" est encore nommé WorkoutSession dans le store ; ici on l'appelle PlannedSession.
  const plannedSessions = usePulseFitStore((s) => s.sessions) as PlannedSession[];
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
  const skipSession = usePulseFitStore((s) => s.skipSession);
  const confirmRace = usePulseFitStore((s) => s.confirmRace);
  const rejectRace = usePulseFitStore((s) => s.rejectRace);

  // ── store propositions ──
  const proposals = useProposalStore((s) => s.proposals);
  const proposalLoaded = useProposalStore((s) => s.loaded);
  const loadProposals = useProposalStore((s) => s.load);
  const acceptProposal = useProposalStore((s) => s.accept);
  const rejectProposal = useProposalStore((s) => s.reject);

  // Charge les propositions une fois les données principales prêtes
  const loadCalledRef = useRef(false);
  useEffect(() => {
    if (dataReady && !loadCalledRef.current) {
      loadCalledRef.current = true;
      void loadProposals();
    }
  }, [dataReady, loadProposals]);

  // ── dates ──
  const now = useMemo(() => new Date(), []);
  const today = useMemo(() => toISODate(now), [now]);
  const headerDate = useMemo(() => formatTodayHeader(now), [now]);
  const greeting = useMemo(() => greetingForHour(now.getHours()), [now]);
  const phase = useMemo(() => currentPhase(program, today), [program, today]);

  // ── loading ──
  const showSkeleton = useDelayedSkeleton(!dataReady);

  // ── séance du jour (PlannedSession) ──
  const todaySession = useMemo(
    () => plannedSessions.find((s) => s.date === today && !s.skipped),
    [plannedSessions, today],
  );

  // ── proposition en attente (adjust_plan seulement sur Aujourd'hui) ──
  const pendingProposal = useMemo(
    () =>
      proposalLoaded
        ? proposals.find((p) => p.status === 'pending' && p.action === 'adjust_plan')
        : undefined,
    [proposals, proposalLoaded],
  );

  // ── undo toast (session validate / postpone) ──
  const [undoState, setUndoState] = useState<{
    message: string;
    sessionId: string;
    action: 'validate' | 'postpone';
    previousDate?: string;
  } | null>(null);

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

  // ── valider ──
  const handleValidate = useCallback(() => {
    if (!todaySession) return;
    completeSession(todaySession.id);
    setUndoState({ message: 'S\u00e9ance valid\u00e9e', sessionId: todaySession.id, action: 'validate' });
  }, [todaySession, completeSession]);

  // ── reporter ──
  const [postponeVisible, setPostponeVisible] = useState(false);
  const handlePostpone = useCallback(() => setPostponeVisible(true), []);
  const handlePostponeChoice = useCallback(
    (targetDate: string | null) => {
      setPostponeVisible(false);
      if (!todaySession) return;
      if (targetDate === null) {
        // « Sauter » : marque la séance comme sautée (sans UndoToast — action définitive)
        skipSession(todaySession.id);
        return;
      }
      const previousDate = todaySession.date;
      moveSession(todaySession.id, targetDate);
      setUndoState({
        message: 'S\u00e9ance report\u00e9e',
        sessionId: todaySession.id,
        action: 'postpone',
        previousDate,
      });
    },
    [todaySession, moveSession, skipSession],
  );

  // ── statut SessionCard ──
  const sessionStatus: SessionStatus = todaySession?.completed ? 'done' : 'planned';

  // ── insights ──
  const derived = useMemo(
    () =>
      sportDerived({
        stravaActivities: activities,
        confirmedIds: confirmedRaceIds,
        rejectedIds: rejectedRaceIds,
        names: raceNames,
        goal,
      }),
    [activities, confirmedRaceIds, rejectedRaceIds, raceNames, goal],
  );

  const athleteProfile: AthleteProfile = useMemo(() => athleteProfileFrom(profile), [profile]);

  // ── ligne de repère FC ──
  const repere = useMemo(
    () => sessionRepere(derived.activities, today),
    [derived.activities, today],
  );

  // ── coach cards ──
  const insights = useMemo(() => {
    if (!dataReady || derived.activities.length === 0) return [];
    const ctx: InsightContext = {
      today,
      activities: derived.activities,
      profile: athleteProfile,
      races: derived.races,
      confirmedIds: derived.confirmedIds,
    };
    // Quand la ligne de repère est affichée, ne pas doubler avec data_quality_no_hr
    const rejectedForever = repere ? ['data_quality_no_hr'] : [];
    return rankInsights(evaluateInsights(ctx), { max: 3, rejectedForever });
  }, [dataReady, today, derived, athleteProfile, repere]);

  // ── insights → CoachCard props ──
  const coachCards: CoachCardProps[] = useMemo(
    () =>
      insights
        .filter((i) => i.ruleId !== 'confirm_race')
        .map((insight) => ({
          kind: 'insight' as const,
          verdict: insight.title,
          body: insight.message,
          source: insightToCoachSource(insight.source),
        })),
    [insights],
  );

  // ── course à confirmer ──
  const raceInsights = useRaceInsights();
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

  // ── instruction de séance ──
  const sessionInstructionText = useMemo(() => {
    if (!todaySession) return '';
    return todaySession.subtitle || todaySession.title;
  }, [todaySession]);

  // ── carte « Ta semaine » pour les débutants (maquette 105) ──
  const weekDots = useMemo(() => {
    if (athleteProfile.level !== 'beginner' || plannedSessions.length === 0) return undefined;
    return buildWeekDots(today, plannedSessions);
  }, [athleteProfile.level, today, plannedSessions]);

  // ── détail d'activité lié pour la carte « C'est une course ? » ──
  const handleRaceDetailPress = useCallback(() => {
    if (raceInsights.confirm) {
      openActivity(raceInsights.confirm.raceId);
    }
  }, [raceInsights.confirm]);

  // ── render squelette ──
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

  const hasData = activities.length > 0 || plannedSessions.length > 0;
  const hasPlan = plannedSessions.length > 0;

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
          <ScreenHeader
            eyebrow={phase ? `${headerDate} \u00b7 ${phase}` : headerDate}
            title={`${greeting}, ${firstName}`}
            avatar={{
              initial: firstName.charAt(0).toUpperCase(),
              onPress: () => router.push('/profile'),
            }}
          />
        </View>

        {/* ── S\u00e9ance du jour ── */}
        {!hasData ? (
          <EmptyState
            reason="firstDay"
            title="Bienvenue dans PulseFit."
            body="Connecte une montre ou importe tes activit\u00e9s pour que le coach te conna\u00eesse."
            primary={{ label: 'Configurer', onPress: () => router.push('/profile') }}
          />
        ) : !hasPlan ? (
          <EmptyState
            reason="noPlan"
            title="Pas encore de plan."
            body="Dis au coach ce que tu pr\u00e9pares, il construira ton programme."
            primary={{ label: 'Parler au coach', onPress: () => router.push('/coach') }}
          />
        ) : todaySession ? (
          <SessionCard
            eyebrow="S\u00e9ance du jour"
            title={todaySession.title}
            effort={{ level: todaySession.kind === 'rest' ? 'easy' : 'moderate', scale: 'planned' }}
            instruction={sessionInstructionText}
            {...sessionCardLabels(athleteProfile.level)}
            note={repere}
            status={sessionStatus}
            onValidate={handleValidate}
            onPostpone={handlePostpone}
            onUndo={handleUndo}
          />
        ) : (
          <EmptyState
            reason="restWeek"
            title={`Rien de pr\u00e9vu aujourd\u2019hui.`}
            body="Profite de ta journ\u00e9e de repos, tu reprends bient\u00f4t."
          />
        )}

        {/* ── Carte « C\u2019est une course ? » ── */}
        {raceInsights.confirm ? (
          <CoachCard
            kind="question"
            body={`C\u2019est une course\u00a0? ${raceInsights.confirm.suggestedName}. Consulte le d\u00e9tail avant de r\u00e9pondre.`}
            choices={[
              { id: 'yes', label: 'Oui, c\u2019est une course' },
              { id: 'no', label: 'Non, un entra\u00eenement' },
              { id: 'detail', label: 'Voir l\u2019activit\u00e9' },
            ]}
            selected={raceAnswer}
            columns={1}
            onChoose={(id) => {
              if (id === 'detail') {
                handleRaceDetailPress();
              } else {
                handleRaceConfirm(id);
              }
            }}
            source="device"
            label="Ton coach"
          />
        ) : null}

        {/* ── Cartes coach (insights) ── */}
        {coachCards.map((card, i) => (
          <CoachCard key={`insight-${i}`} {...card} />
        ))}

        {/* ── Proposition en attente ── */}
        {pendingProposal ? (
          <ProposalCard
            context="Proposition du coach"
            title={pendingProposal.title}
            rows={[]}
            rationale={pendingProposal.rationale}
            source={proposalToCardSource(pendingProposal.source)}
            confidence={proposalConfidence(pendingProposal.confidence)}
            status="pending"
            compact
            onAccept={() => void acceptProposal(pendingProposal.id)}
            onEdit={() => openAgent(pendingProposal.title)}
            onReject={() => void rejectProposal(pendingProposal.id)}
          />
        ) : null}

        {/* ── Ta semaine (débutant, maquette 105) ── */}
        {weekDots ? (
          <ListCard testID="today-week-card">
            <View style={styles.weekCard}>
              <Text role="body" weight="semibold" style={styles.weekTitle}>Ta semaine</Text>
              <DayDots days={weekDots} />
            </View>
          </ListCard>
        ) : null}
      </ScrollView>

      <PostponeSheet
        visible={postponeVisible}
        today={today}
        plannedSessions={plannedSessions}
        unavailableDates={unavailableDates}
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
