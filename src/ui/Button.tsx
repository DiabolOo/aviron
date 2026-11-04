import { ActivityIndicator, Pressable } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** `primary` : bouton plein (un seul par écran) ; `secondary` : contour. */
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  busy?: boolean;
  /** Pourquoi le bouton est indisponible, lu par le lecteur d'écran. */
  disabledReason?: string;
  testID?: string;
};

const useStyles = makeStyles((t) => ({
  base: {
    minHeight: t.size.button,
    paddingHorizontal: t.space.screen,
    borderRadius: t.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  primary: { backgroundColor: t.colors.buttonPrimary },
  secondary: { borderWidth: t.size.outline, borderColor: t.colors.line },
  disabled: { backgroundColor: t.colors.surfaceSunken, borderColor: t.colors.surfaceSunken },
}));

export function Button({ label, onPress, variant = 'primary', disabled, busy, disabledReason, testID }: ButtonProps) {
  const styles = useStyles();
  const { colors, opacity } = useTheme();
  const off = disabled || busy;
  const textColor = disabled ? 'inkTertiary' : variant === 'primary' ? 'onButtonPrimary' : 'ink';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={disabled ? disabledReason : undefined}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], disabled && styles.disabled, pressed && { opacity: opacity.pressed }]}>
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onButtonPrimary : colors.ink} />
      ) : (
        <Text role="body" weight="semibold" color={textColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
