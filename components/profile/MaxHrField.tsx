import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text, TextInput } from '@/components/ui/Text';
import { MAX_HR_MAX, MAX_HR_MIN, parseMaxHrInput } from '@/src/core/training/engine';
import { useTheme } from '@/src/ui/useTheme';

type MaxHrFieldProps = {
  /** valeur saisie (undefined = automatique) */
  value?: number;
  /** valeur automatique affichée en repère quand rien n'est saisi */
  autoValue?: number;
  onChange: (maxHr: number | undefined) => void;
};

/** Champ numérique : n'enregistre que les entiers de 100 à 230 ; « Auto » efface la saisie. */
export function MaxHrField({ value, autoValue, onChange }: MaxHrFieldProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(value !== undefined ? String(value) : '');
  const invalid = draft.trim() !== '' && parseMaxHrInput(draft) === null;

  const change = (text: string) => {
    const digits = text.replace(/[^\d]/g, '');
    setDraft(digits);
    const parsed = parseMaxHrInput(digits);
    if (parsed !== null) onChange(parsed);
  };

  const reset = () => {
    setDraft('');
    onChange(undefined);
  };

  return (
    <View className="items-end gap-1">
      <View className="flex-row items-center gap-2">
        {value !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revenir à la valeur automatique"
            onPress={reset}
            className="rounded-full bg-fg/5 px-3 py-1.5 active:opacity-60">
            <Text className="text-[13px] font-medium text-muted">Auto</Text>
          </Pressable>
        ) : null}
        <TextInput
          accessibilityLabel="FC max en bpm"
          value={draft}
          onChangeText={change}
          placeholder={autoValue !== undefined ? String(autoValue) : '—'}
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={3}
          className={`w-16 rounded-xl border bg-canvas px-3 py-2 text-center text-base text-fg ${
            invalid ? 'border-fg' : 'border-fg/10'
          }`}
        />
        <Text className="text-xs text-muted">bpm</Text>
      </View>
      {invalid ? (
        <Text accessibilityRole="alert" className="text-[12px] font-medium text-fg">
          Entre {MAX_HR_MIN} et {MAX_HR_MAX} bpm
        </Text>
      ) : null}
    </View>
  );
}
