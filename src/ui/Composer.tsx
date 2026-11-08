import { ArrowUp, X } from 'lucide-react-native';
import { useEffect, type ComponentRef, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { makeStyles, textStyle, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type ComposerProps = {
  onSubmit: (text: string) => void;
  /** Envoi en cours : le bouton est indisponible. */
  busy?: boolean;
  placeholder?: string;
  /** Texte à placer dans le champ ; `nonce` change à chaque nouveau texte. */
  prefill?: { text: string; nonce: number };
  /** Ce sur quoi porte la demande (« Modifier » une proposition). */
  context?: { label: string; onClear: () => void };
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.space.sm,
    minHeight: t.size.buttonCompact,
    paddingLeft: t.space.lg,
    paddingRight: t.space.sm,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.coachSurface,
  },
  chipLabel: { flexShrink: 1 },
  chipClear: { width: t.size.touchMin, minHeight: t.size.buttonCompact, alignItems: 'center', justifyContent: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    minHeight: t.size.button,
    paddingLeft: t.space.lg,
    paddingRight: t.space.sm,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
  },
  input: { ...textStyle('body', 'regular'), flex: 1, minHeight: t.size.touchMin, color: t.colors.ink, paddingVertical: 0 },
  send: { width: t.size.touchMin, height: t.size.touchMin, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center' },
}));

/** La seule saisie libre vers le coach. */
export function Composer({ onSubmit, busy = false, placeholder = 'Que veux-tu faire ?', prefill, context }: ComposerProps) {
  const styles = useStyles();
  const { colors, size, opacity } = useTheme();
  const [text, setText] = useState(prefill?.text ?? '');
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const [seen, setSeen] = useState(prefill?.nonce ?? 0);
  if (prefill && prefill.nonce !== seen) {
    setSeen(prefill.nonce);
    setText(prefill.text);
  }
  useEffect(() => {
    if (prefill?.nonce) input.current?.focus();
  }, [prefill?.nonce]);

  const value = text.trim();
  const canSend = value.length > 0 && !busy;
  const submit = () => {
    if (!canSend) return;
    setText('');
    onSubmit(value);
  };

  return (
    <View style={styles.root}>
      {context ? (
        <View style={styles.chip} testID="composer-context">
          <Text role="sub" weight="semibold" numberOfLines={1} style={styles.chipLabel}>
            {context.label}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retirer le contexte" onPress={context.onClear} style={styles.chipClear}>
            <X color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.bar}>
        <TextInput
          ref={input}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          placeholder={placeholder}
          placeholderTextColor={colors.inkTertiary}
          returnKeyType="send"
          accessibilityLabel="Message pour le coach"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          accessibilityState={{ disabled: !canSend, busy }}
          disabled={!canSend}
          onPress={submit}
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: canSend ? colors.buttonPrimary : colors.surfaceSunken },
            pressed && { opacity: opacity.pressed },
          ]}>
          <ArrowUp color={canSend ? colors.onButtonPrimary : colors.inkTertiary} size={size.icon} strokeWidth={size.iconStrokeStrong} />
        </Pressable>
      </View>
    </View>
  );
}
