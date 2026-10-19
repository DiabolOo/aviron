import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { UserProfile } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

export type ProfileEdit = Pick<UserProfile, 'firstName' | 'weightKg' | 'heightCm' | 'goalLabel'>;

type EditProfileModalProps = {
  visible: boolean;
  profile: Pick<UserProfile, 'firstName' | 'weightKg' | 'heightCm' | 'goalLabel'>;
  onClose: () => void;
  onSave: (patch: ProfileEdit) => void;
};

type FormProps = Omit<EditProfileModalProps, 'visible'> & { paddingBottom: number };

const INPUT_CLASS = 'mt-2 rounded-2xl border border-fg/5 bg-canvas px-4 py-3 text-base text-fg';

const parseNumber = (value: string): number => Number(value.replace(',', '.'));

function EditProfileForm({ paddingBottom, profile, onClose, onSave }: FormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(profile.firstName);
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [goal, setGoal] = useState(profile.goalLabel);

  const weightValue = parseNumber(weight);
  const heightValue = parseNumber(height);
  const canSubmit =
    name.trim().length > 0 &&
    goal.trim().length > 0 &&
    weightValue >= 30 &&
    weightValue <= 250 &&
    heightValue >= 100 &&
    heightValue <= 250;

  const submit = () => {
    if (!canSubmit) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      firstName: name.trim(),
      weightKg: Math.round(weightValue * 10) / 10,
      heightCm: Math.round(heightValue),
      goalLabel: goal.trim(),
    });
    onClose();
  };

  return (
    <View
      className="max-h-[90%] rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Modifier le profil</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Label className="mt-5">Prénom</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton prénom"
          placeholderTextColor={colors.muted}
          maxLength={30}
          autoCapitalize="words"
          returnKeyType="next"
          className={INPUT_CLASS}
        />

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Label>Poids (kg)</Label>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="70"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              maxLength={5}
              className={INPUT_CLASS}
            />
          </View>
          <View className="flex-1">
            <Label>Taille (cm)</Label>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={3}
              className={INPUT_CLASS}
            />
          </View>
        </View>

        <Label className="mt-4">Objectif sportif</Label>
        <TextInput
          value={goal}
          onChangeText={setGoal}
          placeholder="Ex : Prépa semi-marathon"
          placeholderTextColor={colors.muted}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={submit}
          className={INPUT_CLASS}
        />
      </ScrollView>

      <View className="mt-6">
        <PrimaryButton label="Enregistrer" onPress={submit} disabled={!canSubmit} />
      </View>
    </View>
  );
}

export function EditProfileModal({ visible, profile, onClose, onSave }: EditProfileModalProps) {
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
          <EditProfileForm
            paddingBottom={insets.bottom + 24}
            profile={profile}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
