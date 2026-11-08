import { router } from 'expo-router';
import { useCallback, type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { canUndoProposal, useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore } from '@/lib/store';
import { agent } from '@/src/agent';
import { MockAgent } from '@/src/agent/MockAgent';
import { toISODate } from '@/src/core/dates';
import type { Proposal } from '@/src/core/schemas';
import { makeStyles, useTheme } from '@/src/design';
import { MODULES } from '@/src/modules';
import { getEnabledModules } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import {
  cardModel,
  formatClock,
  formatStamp,
  isSimpleIntent,
  isSportProposal,
  resolveAdjustment,
  type AdjustQuestion,
  type PlanContext,
} from '@/src/screens/coach/coachEngine';
import { runCoachRequest } from '@/src/screens/coach/coachFlow';
import { useConversation, type Turn, type TurnSource } from '@/src/screens/coach/conversationStore';
import { useAgentDraft } from '@/src/ui/agentDraft';
import { Chip } from '@/src/ui/Chip';
import { CoachCard } from '@/src/ui/CoachCard';
import { Composer } from '@/src/ui/Composer';
import { EmptyState } from '@/src/ui/EmptyState';
import { ProposalCard } from '@/src/ui/ProposalCard';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Skeleton } from '@/src/ui/Skeleton';
import { Text } from '@/src/ui/Text';
import { useDelayedSkeleton } from '@/src/ui/useDelayedSkeleton';
import { useTabBarInset } from '@/src/ui/useTabBarInset';
import { UserBubble } from '@/src/ui/UserBubble';

const engine = new MockAgent();

const EDIT_PROMPT = 'Dis-moi ce que tu veux changer, par exemple « plutôt jeudi ».';
const APPLY_FAILED = 'Pas appliqué : ton plan a changé entre-temps. Réessaie, ou demande-moi autre chose.';
const WHY = 'Pourquoi cette proposition ?';
const REQUEST_FAILED = 'Je n’ai pas pu traiter ta demande. Réessaie dans un instant.';

const STATUS_LABEL = {
  accepted: 'Validée',
  edited: 'Modifiée',
  rejected: 'Laissée de côté',
  undone: 'Annulée',
} as const;

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: t.space.screen,
    paddingTop: t.space.xl,
    gap: t.space.xl,
  },
  section: { gap: t.space.md },
  chips: {
    flexDirection: 'row',
    gap: t.space.sm,
    paddingHorizontal: t.space.screen,
  },
  chipsRow: { flexGrow: 0, paddingTop: t.space.sm },
  note: { paddingHorizontal: t.space.xs },
  composer: { paddingHorizontal: t.space.screen, paddingTop: t.space.sm },
  historyRow: {
    minHeight: t.size.touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingVertical: t.space.sm,
    borderTopWidth: t.size.hairline,
    borderTopColor: t.colors.line,
  },
  historyText: { flex: 1 },
  link: {
    minHeight: t.size.touchMin,
    justifyContent: 'center',
    paddingHorizontal: t.space.sm,
  },
  underline: { textDecorationLine: 'underline' },
}));

type Item = {
  proposal: Proposal;
  source: TurnSource;
  question?: AdjustQuestion;
};

export function CoachScreen() {
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();
  const isEnabled = useIsModuleEnabled();
  const draft = useAgentDraft();

  const dataReady = usePulseFitStore((s) => s.dataReady);
  const sessions = usePulseFitStore((s) => s.sessions);
  const profile = usePulseFitStore((s) => s.profile);
  const consent = usePulseFitStore((s) => s.aiConsent);

  const proposals = useProposalStore((s) => s.proposals);
  const loaded = useProposalStore((s) => s.loaded);
  const load = useProposalStore((s) => s.load);

  const turns = useConversation((s) => s.turns);
  const answers = useConversation((s) => s.answers);

  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState<string[]>([]);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const modelSource: TurnSource = agent.isModel ? 'ai' : 'device';
  const today = toISODate(new Date());
  const plan: PlanContext = useMemo(
    () => ({ sessions, unavailableDates: profile.unavailableDates, today }),
    [sessions, profile.unavailableDates, today],
  );

  const retryLoad = useCallback(() => {
    setLoadFailed(false);
    load().catch(() => setLoadFailed(true));
  }, [load]);
  useEffect(() => {
    if (dataReady) load().catch(() => setLoadFailed(true));
  }, [dataReady, load]);

  const showSkeleton = useDelayedSkeleton(!dataReady || (!loaded && !loadFailed));

  const sportProposals = useMemo(() => proposals.filter(isSportProposal), [proposals]);
  const byId = useMemo(() => new Map(sportProposals.map((p) => [p.id, p])), [sportProposals]);

  // Propositions en attente que la conversation ne porte pas (créées avant, ou depuis Aujourd'hui).
  const orphans = useMemo(() => {
    const inTurns = new Set(turns.flatMap((t) => (t.kind === 'proposal' ? [t.proposalId] : [])));
    return sportProposals
      .filter((p) => p.status === 'pending' && !inTurns.has(p.id))
      .flatMap((p): Item[] => {
        const adjustment = resolveAdjustment(p, plan);
        if (adjustment.kind === 'blocked') return [];
        return [
          {
            proposal: adjustment.proposal,
            source: modelSource,
            question: adjustment.kind === 'ask' ? adjustment.question : undefined,
          },
        ];
      });
  }, [sportProposals, turns, plan, modelSource]);

  const history = useMemo(() => sportProposals.filter((p) => p.status !== 'pending'), [sportProposals]);

  const suggestions = useMemo(
    () =>
      getEnabledModules(MODULES, isEnabled)
        .filter((m) => m.id === 'sport')
        .flatMap((m) => m.agentExamples ?? [])
        .filter((example) => consent || isSimpleIntent(example)),
    [isEnabled, consent],
  );

  const push = useConversation((s) => s.push);

  const send = useCallback(
    async (text: string) => {
      setBusy(true);
      const target = editing;
      push({ kind: 'user', text, at: Date.now() });
      draft.clearContext();
      setEditing(null);
      try {
        const main = usePulseFitStore.getState();
        const result = await runCoachRequest({
          text,
          editing: target ?? undefined,
          consent: main.aiConsent,
          ctx: {
            sessions: main.sessions,
            profile: main.profile,
            today: toISODate(new Date()),
            mealPlanSeed: main.mealPlanSeed,
          },
          agent,
          engine,
        });
        const store = useProposalStore.getState();
        await store.ingest(result.proposals);
        if (result.supersedes) await store.reject(result.supersedes);
        push(...result.turns);
        if (result.navigateTo) router.navigate(result.navigateTo);
      } catch {
        push({ kind: 'coach', text: REQUEST_FAILED, source: 'device' });
      } finally {
        setBusy(false);
      }
    },
    [editing, draft, push],
  );

  const accept = useCallback(
    async (item: Item) => {
      const { proposal, question } = item;
      const answer = useConversation.getState().answers[proposal.id];
      if (question && !answer) return;
      const picked = question?.choices.find((c) => c.id === answer);
      if (picked) push({ kind: 'user', text: picked.label, at: Date.now() });
      setApplying((ids) => [...ids, proposal.id]);
      try {
        const store = useProposalStore.getState();
        if (question)
          await store.edit(proposal.id, {
            ...proposal.payload,
            toDate: answer,
          });
        else await store.accept(proposal.id);
        const after = useProposalStore.getState().proposals.find((p) => p.id === proposal.id);
        if (after?.status === 'pending') push({ kind: 'coach', text: APPLY_FAILED, source: 'device' });
      } finally {
        setApplying((ids) => ids.filter((id) => id !== proposal.id));
      }
    },
    [push],
  );

  const modify = useCallback(
    (proposal: Proposal) => {
      setEditing(proposal);
      draft.set('', `Modifier : ${proposal.title}`);
      push({ kind: 'coach', text: EDIT_PROMPT, source: 'device' });
    },
    [draft, push],
  );

  const pendingItem = useMemo(() => {
    const turn = [...turns]
      .reverse()
      .find((t) => t.kind === 'proposal' && byId.get(t.proposalId)?.status === 'pending');
    if (turn?.kind === 'proposal')
      return {
        proposal: byId.get(turn.proposalId) as Proposal,
        source: turn.source,
      };
    return orphans[0];
  }, [turns, byId, orphans]);

  const explain = useCallback(() => {
    if (!pendingItem) return;
    push(
      { kind: 'user', text: WHY, at: Date.now() },
      {
        kind: 'coach',
        text: pendingItem.proposal.rationale,
        source: pendingItem.source,
      },
    );
  }, [pendingItem, push]);

  const clearContext = useCallback(() => {
    draft.clearContext();
    setEditing(null);
  }, [draft]);

  const renderProposal = (item: Item, eyebrow?: string) => {
    const { proposal, source, question } = item;
    const status = proposal.status;
    if (status === 'rejected' || status === 'undone') {
      return (
        <Text key={proposal.id} role="sub" color="inkSecondary" style={styles.note}>
          {`${STATUS_LABEL[status]} : ${proposal.title}`}
        </Text>
      );
    }
    const answer = answers[proposal.id];
    const model = cardModel(proposal, plan, answer);
    const isApplied = status === 'accepted' || status === 'edited';
    return (
      <ProposalCard
        key={proposal.id}
        {...model}
        eyebrow={
          isApplied
            ? `Ton coach · ${formatClock(new Date(proposal.resolvedAt ?? proposal.createdAt))}`
            : (eyebrow ?? 'Je propose')
        }
        badge={eyebrow ? undefined : 'En attente'}
        onOpenPlan={() => router.navigate('/semaine')}
        source={source}
        status={isApplied ? 'applied' : applying.includes(proposal.id) ? 'applying' : 'pending'}
        question={
          question
            ? {
                prompt: question.prompt,
                choices: question.choices,
                selected: answer,
                onChoose: (choice) => useConversation.getState().answer(proposal.id, choice),
              }
            : undefined
        }
        onAccept={() => void accept(item)}
        onEdit={() => modify(proposal)}
        onReject={() => void useProposalStore.getState().reject(proposal.id)}
      />
    );
  };

  const renderTurn = (turn: Turn) => {
    if (turn.kind === 'user')
      return <UserBubble key={turn.id} text={turn.text} stamp={formatStamp(new Date(turn.at))} />;
    if (turn.kind === 'coach') {
      return <CoachCard key={turn.id} kind="insight" verdict={turn.text} body={turn.detail} source={turn.source} />;
    }
    const proposal = byId.get(turn.proposalId);
    return proposal ? (
      <View key={turn.id}>
        {renderProposal({
          proposal,
          source: turn.source,
          question: turn.question,
        })}
      </View>
    ) : null;
  };

  const header = (
    <ScreenHeader
      title="Coach"
      subtitle="Tu demandes, il prépare, tu valides."
      action={history.length > 0 ? { label: 'Historique', onPress: () => setHistoryOpen((v) => !v) } : undefined}
    />
  );

  if (showSkeleton) {
    return (
      <View style={styles.root} testID="coach-loading">
        <View style={styles.content}>
          {header}
          <Skeleton role="verdict" />
          <Skeleton role="body" />
          <Skeleton role="body" />
        </View>
      </View>
    );
  }

  const empty = turns.length === 0;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => !empty && scroll.current?.scrollToEnd({ animated: true })}
        testID="coach-scroll"
      >
        {header}

        {loadFailed ? (
          <CoachCard
            kind="advice"
            verdict="Je n’arrive pas à charger tes propositions."
            body="Tes données sont intactes. Tu peux quand même me parler."
            action={{ label: 'Réessayer', onPress: retryLoad }}
            source="device"
          />
        ) : null}

        {!consent && empty ? (
          <EmptyState
            reason="noAi"
            title="Je m’occupe de ton plan, sur ton téléphone."
            body="Je décale une séance, je l’allège ou je tiens compte de ta fatigue. Le coach IA ajouterait la construction d’un plan complet et les demandes libres, avec ton accord explicite."
          />
        ) : null}

        {historyOpen && history.length > 0 ? (
          <View style={styles.section} testID="coach-history">
            <Text role="sub" color="inkSecondary">
              {`${history.length} ${history.length > 1 ? 'propositions' : 'proposition'}`}
            </Text>
            {history.map((p) => (
              <View key={p.id} style={styles.historyRow}>
                <View style={styles.historyText}>
                  <Text role="sub" weight="semibold">
                    {p.title}
                  </Text>
                  <Text role="caption" color="inkTertiary">
                    {STATUS_LABEL[p.status as keyof typeof STATUS_LABEL]}
                  </Text>
                </View>
                {canUndoProposal(p) ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Annuler ${p.title}`}
                    onPress={() => void useProposalStore.getState().undo(p.id)}
                    style={styles.link}
                  >
                    <Text role="sub" weight="semibold" style={styles.underline}>
                      Annuler
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {orphans.length > 0 ? (
          <View style={styles.section} testID="coach-pending">
            {orphans.map((item) => renderProposal(item, `À décider · ${orphans.length}`))}
          </View>
        ) : null}

        {turns.map(renderTurn)}
      </ScrollView>

      {suggestions.length > 0 || pendingItem ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipsRow}
          contentContainerStyle={styles.chips}
          testID="coach-suggestions"
        >
          {pendingItem ? <Chip label={WHY} disabled={busy} onPress={explain} /> : null}
          {suggestions.map((example) => (
            <Chip key={example} label={example} disabled={busy} onPress={() => draft.set(example, draft.context)} />
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.composer, { paddingBottom: tabBarInset + space.sm }]}>
        <Composer
          onSubmit={(text) => void send(text)}
          busy={busy}
          prefill={{ text: draft.text, nonce: draft.nonce }}
          context={draft.context ? { label: draft.context, onClear: clearContext } : undefined}
        />
      </View>

    </KeyboardAvoidingView>
  );
}
