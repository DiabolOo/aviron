import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/lib/useTheme';

type EditNameSheetProps = {
  visible: boolean;
  firstName: string;
  onClose: () => void;
  onSave: (firstName: string) => void;
};

type EditNameFormProps = {
  paddingBottom: number;
  firstName: string;
  onClose: () => void;
  onSave: (firstName: string) => void;
};

function EditNameForm({ paddingBottom, firstName, onClose, onSave }: EditNameFormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(firstName);

  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(name.trim());
    onClose();
  };

  return (
    <View
      className="rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Prénom</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Ton prénom"
        placeholderTextColor={colors.muted}
        maxLength={30}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={submit}
        className="mt-5 rounded-2xl border border-fg/5 bg-canvas px-4 py-3 text-base text-fg"
      />

      <View className="mt-6">
        <PrimaryButton label="Enregistrer" onPress={submit} disabled={!canSubmit} />
      </View>
    </View>
  );
}

export function EditNameSheet({ visible, firstName, onClose, onSave }: EditNameSheetProps) {
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
          <EditNameForm
            paddingBottom={insets.bottom + 24}
            firstName={firstName}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
