import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/lib/useTheme';

const CUSTOM_GOAL = 'custom';

const GOAL_PRESETS = [
  'Remise en forme',
  'Perte de poids',
  'Prépa 10 km',
  'Prépa semi-marathon',
  'Prépa marathon',
] as const;

type GoalSheetProps = {
  visible: boolean;
  goal: string;
  onClose: () => void;
  onSave: (goalLabel: string) => void;
};

type GoalFormProps = {
  paddingBottom: number;
  goal: string;
  onClose: () => void;
  onSave: (goalLabel: string) => void;
};

function GoalOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-2xl border px-4 py-3.5 active:opacity-70 ${
        selected ? 'border-fg bg-fg' : 'border-fg/5 bg-canvas'
      }`}>
      <Text className={`text-base ${selected ? 'font-semibold text-canvas' : 'text-fg'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function GoalForm({ paddingBottom, goal, onClose, onSave }: GoalFormProps) {
  const { colors } = useTheme();
  const isPreset = (GOAL_PRESETS as readonly string[]).includes(goal);
  const [selected, setSelected] = useState<string>(isPreset ? goal : CUSTOM_GOAL);
  const [custom, setCustom] = useState(isPreset ? '' : goal);

  const canSubmit = selected !== CUSTOM_GOAL || custom.trim().length > 0;

  const select = (id: string) => {
    void Haptics.selectionAsync();
    setSelected(id);
  };

  const submit = () => {
    if (!canSubmit) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(selected === CUSTOM_GOAL ? custom.trim() : selected);
    onClose();
  };

  return (
    <View
      className="rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Objectif sportif</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <View className="mt-5 gap-2">
        {GOAL_PRESETS.map((preset) => (
          <GoalOption
            key={preset}
            label={preset}
            selected={selected === preset}
            onPress={() => select(preset)}
          />
        ))}
        <GoalOption
          label="Autre objectif"
          selected={selected === CUSTOM_GOAL}
          onPress={() => select(CUSTOM_GOAL)}
        />
      </View>

      {selected === CUSTOM_GOAL ? (
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="Ex : Prépa triathlon"
          placeholderTextColor={colors.muted}
          maxLength={60}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          className="mt-3 rounded-2xl border border-fg/5 bg-canvas px-4 py-3 text-base text-fg"
        />
      ) : null}

      <View className="mt-6">
        <PrimaryButton label="Enregistrer" onPress={submit} disabled={!canSubmit} />
      </View>
    </View>
  );
}

export function GoalSheet({ visible, goal, onClose, onSave }: GoalSheetProps) {
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
          <GoalForm
            paddingBottom={insets.bottom + 24}
            goal={goal}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
