import { X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { weekDates } from '@/src/core/dates';
import { parseProposalPayload } from '@/src/core/proposalActions';
import type { Proposal } from '@/src/core/schemas';
import { useTheme } from '@/src/ui/useTheme';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const WEEK_OPTIONS = weekDates().map((date) => ({
  id: date,
  label: `${DAY_LABELS[new Date(`${date}T00:00:00`).getDay()]}.`,
}));

type ProposalEditSheetProps = {
  proposal: Proposal;
  visible: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
};

function EditForm({
  proposal,
  paddingBottom,
  onClose,
  onSave,
}: {
  proposal: Proposal;
  paddingBottom: number;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const { colors } = useTheme();
  const parsed = parseProposalPayload(proposal);

  const [toDate, setToDate] = useState(
    parsed?.action === 'adjust_plan' ? parsed.payload.toDate : WEEK_OPTIONS[0].id,
  );
  const [carbs, setCarbs] = useState(
    parsed?.action === 'adjust_nutrition_targets' ? parsed.payload.macros.carbs : 0,
  );
  const [calories, setCalories] = useState(
    parsed?.action === 'log_meal' ? parsed.payload.meal.macros.calories : 0,
  );

  const submit = () => {
    if (!parsed) return;
    if (parsed.action === 'adjust_plan') {
      onSave({ sessionId: parsed.payload.sessionId, toDate });
    } else if (parsed.action === 'adjust_nutrition_targets') {
      const macros = parsed.payload.macros;
      onSave({
        macros: {
          calories: macros.protein * 4 + carbs * 4 + macros.fat * 9,
          protein: macros.protein,
          carbs,
          fat: macros.fat,
        },
      });
    } else if (parsed.action === 'log_meal') {
      const meal = parsed.payload.meal;
      const ratio = meal.macros.calories > 0 ? calories / meal.macros.calories : 1;
      onSave({
        meal: {
          ...meal,
          macros: {
            calories,
            protein: Math.round(meal.macros.protein * ratio),
            carbs: Math.round(meal.macros.carbs * ratio),
            fat: Math.round(meal.macros.fat * ratio),
          },
        },
      });
    }
    onClose();
  };

  return (
    <View
      className="rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Modifier</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <View className="mt-5 items-center">
        {parsed?.action === 'adjust_plan' ? (
          <Segmented
            options={WEEK_OPTIONS}
            value={toDate}
            onChange={setToDate}
            className="self-stretch"
          />
        ) : null}
        {parsed?.action === 'adjust_nutrition_targets' ? (
          <Stepper
            value={carbs}
            step={10}
            min={0}
            max={800}
            unit="g glucides"
            onChange={setCarbs}
          />
        ) : null}
        {parsed?.action === 'log_meal' ? (
          <Stepper
            value={calories}
            step={25}
            min={0}
            max={3000}
            unit="kcal"
            onChange={setCalories}
          />
        ) : null}
      </View>

      <View className="mt-6">
        <PrimaryButton label="Valider la modification" onPress={submit} disabled={!parsed} />
      </View>
    </View>
  );
}

export function ProposalEditSheet({ proposal, visible, onClose, onSave }: ProposalEditSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Fermer"
          onPress={onClose}
          className="absolute inset-0 bg-black/50"
        />
        {visible ? (
          <EditForm
            proposal={proposal}
            paddingBottom={insets.bottom + 24}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
