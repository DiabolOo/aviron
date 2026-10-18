import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
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
import { Stepper } from '@/components/ui/Stepper';
import type { Macros, Meal } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type MealEditSheetProps = {
  meal: Meal | null;
  onClose: () => void;
  onSave: (mealId: string, patch: Partial<Meal>) => void;
  onDelete: (mealId: string) => void;
};

type MealEditFormProps = {
  meal: Meal;
  paddingBottom: number;
  onClose: () => void;
  onSave: (mealId: string, patch: Partial<Meal>) => void;
  onDelete: (mealId: string) => void;
};

function MacroRow({
  label,
  first = false,
  children,
}: {
  label: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <View className={`flex-row items-center py-3 ${first ? '' : 'border-t border-fg/5'}`}>
      <Text className="flex-1 text-base text-fg">{label}</Text>
      {children}
    </View>
  );
}

function MealEditForm({ meal, paddingBottom, onClose, onSave, onDelete }: MealEditFormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(meal.name);
  const [macros, setMacros] = useState<Macros>(meal.macros);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = () => {
    onSave(meal.id, { name: name.trim() || meal.name, macros });
    onClose();
  };

  const remove = () => {
    if (!confirmingDelete) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setConfirmingDelete(true);
      return;
    }
    onDelete(meal.id);
    onClose();
  };

  const setMacro = (key: keyof Macros) => (value: number) => {
    setMacros((current) => ({ ...current, [key]: value }));
  };

  return (
    <View
      className="rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Modifier le repas</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nom du repas"
        placeholderTextColor={colors.muted}
        maxLength={60}
        className="mt-5 rounded-2xl border border-fg/5 bg-canvas px-4 py-3 text-base text-fg"
      />

      <View className="mt-4">
        <MacroRow first label="Calories">
          <Stepper
            value={macros.calories}
            step={10}
            min={0}
            max={3000}
            unit="kcal"
            onChange={setMacro('calories')}
          />
        </MacroRow>
        <MacroRow label="Protéines">
          <Stepper
            value={macros.protein}
            step={5}
            min={0}
            max={300}
            unit="g"
            onChange={setMacro('protein')}
          />
        </MacroRow>
        <MacroRow label="Glucides">
          <Stepper
            value={macros.carbs}
            step={5}
            min={0}
            max={500}
            unit="g"
            onChange={setMacro('carbs')}
          />
        </MacroRow>
        <MacroRow label="Lipides">
          <Stepper
            value={macros.fat}
            step={5}
            min={0}
            max={200}
            unit="g"
            onChange={setMacro('fat')}
          />
        </MacroRow>
      </View>

      <View className="mt-8 gap-3">
        <PrimaryButton label="Enregistrer" onPress={save} />
        <PrimaryButton
          variant="ghost"
          label={confirmingDelete ? 'Confirmer la suppression' : 'Supprimer'}
          onPress={remove}
        />
      </View>
    </View>
  );
}

export function MealEditSheet({ meal, onClose, onSave, onDelete }: MealEditSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={Boolean(meal)}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Fermer"
          onPress={onClose}
          className="absolute inset-0 bg-black/50"
        />
        {meal ? (
          <MealEditForm
            key={meal.id}
            meal={meal}
            paddingBottom={insets.bottom + 24}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
