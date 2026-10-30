import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import { LayoutAnimation, Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { Proposal } from '@/src/core/schemas';
import { useTheme } from '@/src/ui/useTheme';

import { ProposalEditSheet } from './ProposalEditSheet';

const SOURCE_DOT: Record<Proposal['source'], string> = {
  coach: 'bg-accent',
  nutrition: 'bg-aqua',
  agent: 'bg-iris',
};

const SOURCE_LABEL: Record<Proposal['source'], string> = {
  coach: 'Coach',
  nutrition: 'Nutrition',
  agent: 'Agent',
};

type ProposalCardProps = {
  proposal: Proposal;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string, payload: Record<string, unknown>) => void;
};

export function ProposalCard({ proposal, onAccept, onReject, onEdit }: ProposalCardProps) {
  const { colors } = useTheme();
  const [whyOpen, setWhyOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const toggleWhy = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWhyOpen((v) => !v);
  };

  const accept = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept(proposal.id);
  };

  return (
    <View className="rounded-3xl border border-fg/5 bg-surface p-5">
      <View className="flex-row items-center gap-2">
        <View className={`h-2 w-2 rounded-full ${SOURCE_DOT[proposal.source]}`} />
        <Label>{SOURCE_LABEL[proposal.source]}</Label>
        <View className="flex-1" />
        <Text className="text-xs text-muted">{Math.round(proposal.confidence * 100)} %</Text>
        <IconButton label="Refuser" variant="outline" onPress={() => onReject(proposal.id)}>
          <X color={colors.fg} size={14} strokeWidth={1.8} />
        </IconButton>
      </View>

      <Text className="mt-3 text-xl font-semibold tracking-tight text-fg">
        {proposal.title}
      </Text>

      {proposal.preview ? (
        <View className="mt-2 flex-row items-center gap-2">
          {proposal.preview.before ? (
            <Text className="text-sm text-muted line-through">{proposal.preview.before}</Text>
          ) : null}
          <Text className="text-sm text-muted">→</Text>
          <Text className="text-sm font-medium text-fg">{proposal.preview.after}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={toggleWhy}
        className="mt-3 flex-row items-center gap-1 active:opacity-60">
        <Text className="text-xs font-medium text-muted">Pourquoi ?</Text>
        <ChevronDown
          color={colors.muted}
          size={13}
          strokeWidth={2}
          style={whyOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
        />
      </Pressable>
      {whyOpen ? (
        <Text className="mt-1 text-sm text-muted">{proposal.rationale}</Text>
      ) : null}

      <View className="mt-4 flex-row items-center gap-4">
        <View className="flex-1">
          <PrimaryButton label="Valider" onPress={accept} icon={<Check color={colors.accentFg} size={16} strokeWidth={2.2} />} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Modifier"
          onPress={() => setEditing(true)}
          className="py-2 active:opacity-60">
          <Text className="text-sm font-medium text-muted">Modifier</Text>
        </Pressable>
      </View>

      <ProposalEditSheet
        proposal={proposal}
        visible={editing}
        onClose={() => setEditing(false)}
        onSave={(payload) => onEdit(proposal.id, payload)}
      />
    </View>
  );
}
