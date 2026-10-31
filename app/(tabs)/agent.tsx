import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Text } from '@/components/ui/Text';
import { useProposalStore } from '@/lib/proposalStore';
import { Rise } from '@/src/ui/motion/Rise';
import { CommandBar } from '@/src/ui/CommandBar';
import { ProposalCard } from '@/src/ui/proposals/ProposalCard';

const SUGGESTIONS = ['Claqué, 45 min max', 'J’ai mangé des pâtes', 'Décale la sortie longue'];
const STATUS_LABEL = { accepted: 'Validée', edited: 'Modifiée', rejected: 'Refusée', undone: 'Annulée' } as const;

export default function AgentScreen() {
  const proposals = useProposalStore((s) => s.proposals);
  const ask = useProposalStore((s) => s.ask);
  const accept = useProposalStore((s) => s.accept);
  const reject = useProposalStore((s) => s.reject);
  const edit = useProposalStore((s) => s.edit);
  const undo = useProposalStore((s) => s.undo);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  const pending = proposals.filter((p) => p.status === 'pending');
  const history = proposals.filter((p) => p.status !== 'pending').slice(0, 5);

  const send = async (text: string) => {
    setBusy(true);
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
          <ScreenTitle title="Agent" />
        </Rise>
        <Rise index={1}>
          <CommandBar onSubmit={send} busy={busy} />
        </Rise>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerClassName="gap-2 px-5 py-1">
          {SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void send(suggestion)}
              className="h-[42px] justify-center rounded-full border border-fg/10 bg-surface px-4 active:scale-95">
              <Text numberOfLines={1} className="text-[16px] font-medium text-fg">
                {suggestion}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {reply ? <Text className="text-[16px] text-fg">{reply}</Text> : null}

        <Text className="mt-1.5 text-[16px] font-medium text-muted">
          {pending.length > 0 ? `Propositions · ${pending.length}` : 'Aucune proposition en attente'}
        </Text>
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

        {history.length > 0 ? (
          <>
            <Text className="mt-3 text-[16px] font-medium text-muted">Historique</Text>
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
          </>
        ) : null}
      </View>
    </Screen>
  );
}
