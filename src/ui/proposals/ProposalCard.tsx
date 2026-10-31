import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { CardTint } from '@/components/ui/CardHalo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { mealMomentForHour } from '@/src/core/dates';
import { parseProposalPayload } from '@/src/core/proposalActions';
import type { Proposal } from '@/src/core/schemas';
import { useTheme } from '@/src/ui/useTheme';

import { ProposalEditSheet } from './ProposalEditSheet';

const MOMENT_LABEL = { morning: 'matin', noon: 'midi', snack: 'collation', evening: 'dîner' } as const;

type Kind = { chip: string; tint: CardTint; chipClass: string; textClass: string };

function kindOf(proposal: Proposal): Kind {
  switch (proposal.action) {
    case 'adjust_plan':
      return { chip: 'Plan', tint: 'sport', chipClass: 'bg-sport-tint', textClass: 'text-sport' };
    case 'log_meal': {
      const parsed = parseProposalPayload(proposal);
      const hour =
        parsed?.action === 'log_meal' ? Number(parsed.payload.meal.loggedAt.slice(11, 13)) : 12;
      return {
        chip: `Repas · ${MOMENT_LABEL[mealMomentForHour(hour)]}`,
        tint: 'nutri',
        chipClass: 'bg-nutri-tint',
        textClass: 'text-[#9A3412] dark:text-muted',
      };
    }
    default:
      return {
        chip: 'Nutrition · objectif',
        tint: 'nutri',
        chipClass: 'bg-nutri-tint',
        textClass: 'text-[#9A3412] dark:text-muted',
      };
  }
}

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
  const kind = kindOf(proposal);
  const parsed = parseProposalPayload(proposal);
  const meal = parsed?.action === 'log_meal' ? parsed.payload.meal : null;
  const askConfirm = Boolean(meal) && proposal.confidence < 0.8;

  const accept = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept(proposal.id);
  };

  return (
    <Card tint={kind.tint} className="gap-3 p-[18px]">
      <View className="flex-row items-center justify-between">
        <View className={`rounded-xl px-2.5 py-1 ${kind.chipClass}`}>
          <Text className={`text-[15px] font-semibold ${kind.textClass}`}>{kind.chip}</Text>
        </View>
        {meal ? (
          <Text className="text-[15px] text-muted">
            {proposal.confidence >= 0.8 ? 'Confiance haute' : 'Confiance moyenne'}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pourquoi ?"
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setWhyOpen((v) => !v);
            }}
            className="h-11 justify-center active:opacity-60">
            <Text className="text-[15px] text-muted underline">Pourquoi ?</Text>
          </Pressable>
        )}
      </View>

      {meal ? (
        <View className="flex-row items-baseline justify-between gap-3">
          <Text numberOfLines={1} className="flex-1 text-[20px] font-semibold text-fg">
            {meal.name}
          </Text>
          <Text className="text-[20px] font-bold text-fg">
            {Math.round(meal.macros.calories)}
            <Text className="text-[15px] font-medium text-muted"> kcal</Text>
          </Text>
        </View>
      ) : (
        <Text className="text-[20px] font-semibold tracking-tight text-fg">{proposal.title}</Text>
      )}

      {proposal.preview ? (
        <View className="flex-row items-center gap-2.5">
          {proposal.preview.before ? (
            <Text className="text-[16px] text-muted line-through">{proposal.preview.before}</Text>
          ) : null}
          <ArrowRight color={colors.muted} size={16} strokeWidth={2} />
          <Text className="text-[16px] font-semibold text-fg">{proposal.preview.after}</Text>
        </View>
      ) : null}

      {askConfirm ? (
        <Text className="text-[16px] text-muted">Une assiette moyenne, c’est bien ça ?</Text>
      ) : null}
      {whyOpen || meal ? (
        <Text className="text-[15px] text-muted">{whyOpen || !askConfirm ? proposal.rationale : ''}</Text>
      ) : null}

      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <PrimaryButton label={askConfirm ? 'Oui, valider' : 'Valider'} onPress={accept} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={askConfirm ? 'Corriger' : 'Modifier'}
          onPress={() => setEditing(true)}
          className="h-11 justify-center rounded-full bg-chip px-[18px] active:scale-95">
          <Text className="text-[16px] font-medium text-fg">{askConfirm ? 'Corriger' : 'Modifier'}</Text>
        </Pressable>
        {askConfirm ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refuser"
            onPress={() => onReject(proposal.id)}
            className="h-11 justify-center px-2 active:opacity-60">
            <Text className="text-[16px] font-medium text-muted">Refuser</Text>
          </Pressable>
        )}
      </View>

      <ProposalEditSheet
        proposal={proposal}
        visible={editing}
        onClose={() => setEditing(false)}
        onSave={(payload) => onEdit(proposal.id, payload)}
      />
    </Card>
  );
}
