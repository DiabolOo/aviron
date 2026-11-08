import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type BackHeaderProps = {
  /** « Semaine », « Cette semaine », « Profil », « Semi de Reims ». */
  label?: string;
  onBack?: () => void;
  /** Modale du profil : « Fermer » à droite. */
  onClose?: () => void;
  closeLabel?: string;
};

const useStyles = makeStyles((t) => ({
  row: { minHeight: t.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  back: { minHeight: t.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: t.space.xs, flexShrink: 1 },
  close: { minHeight: t.size.touchMin, justifyContent: 'center', marginLeft: 'auto' },
}));

/** Retour en texte, sans titre centré ; « Fermer » à droite pour une modale. */
export function BackHeader({ label, onBack, onClose, closeLabel = 'Fermer' }: BackHeaderProps) {
  const styles = useStyles();
  const { colors, size, opacity, space } = useTheme();
  return (
    <View style={styles.row} testID="back-header">
      {onBack && label ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retour : ${label}`}
          onPress={onBack}
          hitSlop={space.sm}
          style={({ pressed }) => [styles.back, pressed && { opacity: opacity.pressed }]}>
          <ChevronLeft color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
          <Text role="body" weight="semibold">
            {label}
          </Text>
        </Pressable>
      ) : null}
      {onClose ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          hitSlop={space.sm}
          style={({ pressed }) => [styles.close, pressed && { opacity: opacity.pressed }]}>
          <Text role="body" weight="semibold">
            {closeLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
