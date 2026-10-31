import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Camera, Mic } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Gradient } from '@/components/ui/Gradient';
import { type InputRef, TextInput } from '@/components/ui/Text';
import { AI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type CommandBarProps = {
  onSubmit: (text: string) => Promise<void> | void;
  placeholder?: string;
  busy?: boolean;
  prefill?: { text: string; nonce: number };
};

export function CommandBar({
  onSubmit,
  placeholder = 'Que veux-tu faire ?',
  busy = false,
  prefill,
}: CommandBarProps) {
  const { colors, scheme } = useTheme();
  const [text, setText] = useState(prefill?.text ?? '');
  const input = useRef<InputRef>(null);

  const [seenNonce, setSeenNonce] = useState(prefill?.nonce ?? 0);
  if (prefill && prefill.nonce !== seenNonce) {
    setSeenNonce(prefill.nonce);
    setText(prefill.text);
  }

  useEffect(() => {
    if (prefill?.nonce) input.current?.focus();
  }, [prefill?.nonce]);

  const submit = async () => {
    const value = text.trim();
    if (!value || busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    await onSubmit(value);
  };

  return (
    <View
      className="h-16 flex-row items-center gap-1.5 rounded-full py-0 pl-[22px] pr-2.5"
      style={{
        backgroundColor: scheme === 'dark' ? colors.surface : '#FFFFFF',
        borderWidth: 1,
        borderColor: scheme === 'dark' ? colors.cardBorder : 'rgba(14,17,22,0.06)',
        shadowColor: '#000',
        shadowOpacity: scheme === 'dark' ? 0.5 : 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}>
      <TextInput
        ref={input}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => void submit()}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="send"
        accessibilityLabel="Message pour l’agent"
        className="h-11 min-w-0 flex-1 p-0 text-[18px] font-medium text-fg"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scanner une assiette"
        onPress={() => router.push('/scan')}
        className="h-11 w-11 items-center justify-center rounded-full bg-chip active:scale-95">
        <Camera color={colors.fg} size={20} strokeWidth={1.9} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text.trim() ? 'Envoyer' : 'Dicter'}
        onPress={() => (text.trim() ? void submit() : input.current?.focus())}
        className="active:scale-95">
        <Gradient
          colors={AI_GRADIENT}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Mic color="#FFFFFF" size={20} strokeWidth={2} />}
        </Gradient>
      </Pressable>
    </View>
  );
}
