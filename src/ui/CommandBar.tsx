import * as Haptics from 'expo-haptics';
import { ArrowUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { useTheme } from '@/src/ui/useTheme';

type CommandBarProps = {
  onSubmit: (text: string) => Promise<void> | void;
  placeholder?: string;
  busy?: boolean;
};

export function CommandBar({
  onSubmit,
  placeholder = 'Dis-moi ce dont tu as besoin…',
  busy = false,
}: CommandBarProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !busy;

  const submit = async () => {
    if (!canSend) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const value = text.trim();
    setText('');
    await onSubmit(value);
  };

  return (
    <View className="min-h-14 flex-row items-center rounded-full border border-fg/10 bg-surface py-1.5 pl-5 pr-1.5">
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => void submit()}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="send"
        accessibilityLabel="Commande pour l’agent"
        className="flex-1 py-2 pr-3 text-base text-fg"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Envoyer"
        disabled={!canSend}
        onPress={() => void submit()}
        className={`h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80 ${
          canSend ? '' : 'opacity-30'
        }`}>
        {busy ? (
          <ActivityIndicator color={colors.accentFg} />
        ) : (
          <ArrowUp color={colors.accentFg} size={20} strokeWidth={2.4} />
        )}
      </Pressable>
    </View>
  );
}
