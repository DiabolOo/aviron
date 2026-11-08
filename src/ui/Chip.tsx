import { Pressable } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type ChipProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

const useStyles = makeStyles((t) => ({
  chip: {
    minHeight: t.size.buttonCompact,
    paddingHorizontal: t.space.lg,
    justifyContent: 'center',
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
  },
}));

/** Une suggestion d'un tap. Toujours un bouton : aucun geste n'est le seul moyen d'agir. */
export function Chip({ label, onPress, disabled }: ChipProps) {
  const styles = useStyles();
  const { opacity } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && { opacity: opacity.pressed }]}>
      <Text role="sub" weight="semibold">
        {label}
      </Text>
    </Pressable>
  );
}
