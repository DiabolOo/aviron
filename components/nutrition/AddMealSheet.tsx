import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Segmented } from '@/components/ui/Segmented';
import { mealMomentForHour, toISODate } from '@/lib/dates';
import type { Macros, Meal, MealMoment } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type AddMealSheetProps = {
  visible: boolean;
  date: string;
  onClose: () => void;
  onAdd: (meal: Omit<Meal, 'id'>, saveAsRecipe: boolean) => void;
};

type AddMealFormProps = {
  paddingBottom: number;
  date: string;
  onClose: () => void;
  onAdd: (meal: Omit<Meal, 'id'>, saveAsRecipe: boolean) => void;
};

type MacroKey = keyof Macros;

const MOMENTS: readonly { id: MealMoment; label: string }[] = [
  { id: 'morning', label: 'Matin' },
  { id: 'noon', label: 'Midi' },
  { id: 'snack', label: 'Collation' },
  { id: 'evening', label: 'Soir' },
];

const MOMENT_HOURS: Record<MealMoment, number> = {
  morning: 8,
  noon: 12,
  snack: 16,
  evening: 20,
};

const MACRO_FIELDS: readonly { key: MacroKey; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protéines', unit: 'g' },
  { key: 'carbs', label: 'Glucides', unit: 'g' },
  { key: 'fat', label: 'Lipides', unit: 'g' },
];

function toGrams(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

function loggedAtFor(moment: MealMoment, date: string): string {
  const now = new Date();
  const isToday = date === toISODate(now);
  const time =
    isToday && mealMomentForHour(now.getHours()) === moment
      ? now.toTimeString().slice(0, 8)
      : `${`${MOMENT_HOURS[moment]}`.padStart(2, '0')}:00:00`;
  return `${date}T${time}`;
}

function AddMealForm({ paddingBottom, date, onClose, onAdd }: AddMealFormProps) {
  const { colors } = useTheme();
  const [moment, setMoment] = useState<MealMoment>(() =>
    mealMomentForHour(new Date().getHours()),
  );
  const [name, setName] = useState('');
  const [saveAsRecipe, setSaveAsRecipe] = useState(false);
  const [fields, setFields] = useState<Record<MacroKey, string>>({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const canSubmit = name.trim().length > 0;

  const setField = (key: MacroKey) => (text: string) => {
    setFields((current) => ({ ...current, [key]: text.replace(/[^0-9]/g, '') }));
  };

  const submit = () => {
    if (!canSubmit) return;
    const macros: Macros = {
      calories: toGrams(fields.calories),
      protein: toGrams(fields.protein),
      carbs: toGrams(fields.carbs),
      fat: toGrams(fields.fat),
    };
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(
      { name: name.trim(), loggedAt: loggedAtFor(moment, date), macros, confidence: 1 },
      saveAsRecipe,
    );
    onClose();
  };

  return (
    <View
      className="rounded-t-3xl border border-fg/5 bg-surface px-6 pt-3"
      style={{ paddingBottom }}>
      <View className="h-1 w-10 self-center rounded-full bg-fg/15" />

      <View className="mt-4 flex-row items-center justify-between">
        <Label>Ajout manuel</Label>
        <IconButton label="Fermer" onPress={onClose}>
          <X color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>

      <Segmented options={MOMENTS} value={moment} onChange={setMoment} className="mt-5" />

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nom du plat ou aliment"
        placeholderTextColor={colors.muted}
        maxLength={60}
        autoFocus
        className="mt-5 rounded-2xl border border-fg/5 bg-canvas px-4 py-3 text-base text-fg"
      />

      <View className="mt-2">
        {MACRO_FIELDS.map((field, index) => (
          <View
            key={field.key}
            className={`flex-row items-center py-3 ${index === 0 ? '' : 'border-t border-fg/5'}`}>
            <Text className="flex-1 text-base text-fg">{field.label}</Text>
            <TextInput
              value={fields[field.key]}
              onChangeText={setField(field.key)}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={4}
              className="w-20 rounded-xl border border-fg/5 bg-canvas px-3 py-2 text-right text-base font-semibold text-fg"
            />
            <Text className="w-9 text-right text-xs text-muted">{field.unit}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row items-center justify-between border-t border-fg/5 pt-3">
        <Text className="flex-1 pr-4 text-base text-fg">Sauvegarder dans mes recettes personnelles</Text>
        <Switch value={saveAsRecipe} onValueChange={setSaveAsRecipe} trackColor={{ true: colors.accent }} />
      </View>

      <View className="mt-6">
        <PrimaryButton label="Ajouter au journal" onPress={submit} disabled={!canSubmit} />
      </View>
    </View>
  );
}

export function AddMealSheet({ visible, date, onClose, onAdd }: AddMealSheetProps) {
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
          <AddMealForm
            paddingBottom={insets.bottom + 24}
            date={date}
            onClose={onClose}
            onAdd={onAdd}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
