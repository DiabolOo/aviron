import { router } from 'expo-router';
import { ChevronDown, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Text } from '@/components/ui/Text';
import { useProposalStore } from '@/lib/proposalStore';
import { MODULES } from '@/src/modules';
import { getEnabledModules } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { CommandBar } from '@/src/ui/CommandBar';
import { useAgentDraft } from '@/src/ui/agentDraft';
import { Rise } from '@/src/ui/motion/Rise';
import { ProposalCard } from '@/src/ui/proposals/ProposalCard';
import { useTheme } from '@/src/ui/useTheme';

const STATUS_LABEL = { accepted: 'Validée', edited: 'Modifiée', rejected: 'Refusée', undone: 'Annulée' } as const;
const DOT_CLASS = { sport: 'bg-sport', nutri: 'bg-nutri', iris: 'bg-iris', aqua: 'bg-aqua' } as const;

export default function AgentScreen() {
  const { colors } = useTheme();
  const isEnabled = useIsModuleEnabled();
  const proposals = useProposalStore((s) => s.proposals);
  const ask = useProposalStore((s) => s.ask);
  const accept = useProposalStore((s) => s.accept);
  const reject = useProposalStore((s) => s.reject);
  const edit = useProposalStore((s) => s.edit);
  const undo = useProposalStore((s) => s.undo);
  const draft = useAgentDraft();
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pending = proposals.filter((p) => p.status === 'pending');
  const history = proposals.filter((p) => p.status !== 'pending');
  const evening = new Date().getHours() >= 18;
  const groups = getEnabledModules(MODULES, isEnabled)
    .filter((m) => m.agentExamples?.length)
    .sort((a, b) => (evening ? Number(b.id === 'nutrition') - Number(a.id === 'nutrition') : 0));

  const send = async (text: string) => {
    setBusy(true);
    draft.clearContext();
    try {
      const result = await ask(text);
      setReply(result.reply);
      if (result.navigateTo) router.navigate(result.navigateTo);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen tone="agent">
      <View className="gap-3.5">
        <Rise index={0}>
          <ScreenTitle title="Ton agent" subtitle="Demande, il propose, tu valides" />
        </Rise>

        <Rise index={1}>
          <View className="gap-2.5">
            {draft.context ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retirer le contexte"
                onPress={draft.clearContext}
                className="h-9 flex-row items-center gap-1.5 self-start rounded-full bg-chip pl-3.5 pr-2.5 active:opacity-70">
                <Text className="text-[15px] font-medium text-fg">{draft.context}</Text>
                <X color={colors.muted} size={15} strokeWidth={2.2} />
              </Pressable>
            ) : null}
            <CommandBar onSubmit={send} busy={busy} prefill={{ text: draft.text, nonce: draft.nonce }} />
            {reply ? <Text className="px-1 text-[16px] text-fg">{reply}</Text> : null}
          </View>
        </Rise>

        {pending.length > 0 ? (
          <View className="gap-3.5">
            <Text className="mt-1.5 text-[17px] font-semibold text-fg">À valider ({pending.length})</Text>
            {pending.map((proposal, i) => (
              <Rise key={proposal.id} index={i + 2}>
                <ProposalCard
                  proposal={proposal}
                  onAccept={(id) => void accept(id)}
                  onReject={(id) => void reject(id)}
                  onEdit={(id, payload) => void edit(id, payload)}
                />
              </Rise>
            ))}
          </View>
        ) : null}

        <Card className="gap-1 px-[18px] py-3.5">
          <Text className="pb-1.5 text-[17px] font-semibold text-fg">Tu peux lui demander</Text>
          {groups.map((module) => (
            <View key={module.id} className="gap-0.5 pt-1.5">
              <View className="flex-row items-center gap-2">
                <View className={`h-2 w-2 rounded-full ${DOT_CLASS[module.color ?? 'iris']}`} />
                <Text className="text-[14px] font-medium text-muted">{module.title}</Text>
              </View>
              {module.agentExamples?.map((example) => (
                <Pressable
                  key={example}
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => draft.set(example, draft.context)}
                  className="min-h-11 flex-row items-center justify-between gap-3 active:opacity-60">
                  <Text className="flex-1 text-[16px] text-fg">« {example} »</Text>
                  <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          ))}
        </Card>

        {history.length > 0 ? (
          <View className="gap-2.5">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: historyOpen }}
              onPress={() => setHistoryOpen((v) => !v)}
              className="min-h-11 flex-row items-center gap-1.5 active:opacity-60">
              <Text className="text-[16px] font-medium text-muted">
                Historique · {history.length} {history.length > 1 ? 'propositions' : 'proposition'}
              </Text>
              {historyOpen ? (
                <ChevronDown color={colors.muted} size={18} strokeWidth={2} />
              ) : (
                <ChevronRight color={colors.muted} size={18} strokeWidth={2} />
              )}
            </Pressable>
            {historyOpen ? (
              <Card className="px-[18px] py-2">
                {history.map((proposal, i) => (
                  <View
                    key={proposal.id}
                    className={`min-h-14 flex-row items-center gap-3 ${i > 0 ? 'border-t border-fg/10' : ''}`}>
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-[16px] font-medium text-fg">
                        {proposal.title}
                      </Text>
                      <Text className="text-[14px] text-muted">
                        {STATUS_LABEL[proposal.status as keyof typeof STATUS_LABEL]}
                      </Text>
                    </View>
                    {proposal.status === 'accepted' || proposal.status === 'edited' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Annuler ${proposal.title}`}
                        onPress={() => void undo(proposal.id)}
                        className="h-11 justify-center px-2 active:opacity-60">
                        <Text className="text-[15px] font-semibold text-fg underline">Annuler</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </Card>
            ) : null}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
