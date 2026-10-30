import { router } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { TabHeader } from '@/components/ui/TabHeader';
import { TAB_ICONS } from '@/components/ui/tabIcons';
import { useProposalStore } from '@/lib/proposalStore';
import { CommandBar } from '@/src/ui/CommandBar';
import { ProposalStack } from '@/src/ui/proposals/ProposalStack';
import { useTheme } from '@/src/ui/useTheme';

const SUGGESTIONS = ['Claqué, 45 min max', 'J’ai mangé des pâtes', 'Décale la sortie longue'];

export default function AgentScreen() {
  const { colors } = useTheme();
  const ask = useProposalStore((s) => s.ask);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  const send = async (text: string) => {
    setBusy(true);
    try {
      setReply(await ask(text));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <TabHeader icon={TAB_ICONS.agent} tint="accent" eyebrow="Ton assistant" title="Agent" />

      <View className="mt-8">
        <CommandBar onSubmit={send} busy={busy} />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void send(suggestion)}
            className="min-h-11 justify-center rounded-full border border-fg/10 px-4 active:opacity-70">
            <Text className="text-sm text-fg">{suggestion}</Text>
          </Pressable>
        ))}
      </View>

      {reply ? (
        <View className="mt-8">
          <Label>Agent</Label>
          <Text className="mt-2 text-base text-fg">{reply}</Text>
        </View>
      ) : null}

      <ProposalStack />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scanner une assiette"
        onPress={() => router.push('/scan')}
        className="mt-10 min-h-12 flex-row items-center justify-center gap-2 rounded-full border border-fg/10 active:opacity-70">
        <ScanLine color={colors.fg} size={18} strokeWidth={1.8} />
        <Text className="text-sm font-medium text-fg">Scanner une assiette</Text>
      </Pressable>
    </Screen>
  );
}
