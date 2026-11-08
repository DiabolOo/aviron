import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type StepHeaderProps = {
  /** Étape en cours, à partir de 1. */
  step: number;
  total: number;
  /** « 2 sur 4 ». */
  label: string;
  /** Absent à la première étape. */
  onBack?: () => void;
};

const useStyles = makeStyles((t) => ({
  row: { minHeight: t.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  back: { width: t.size.touchMin, height: t.size.touchMin, alignItems: 'center', justifyContent: 'center', marginLeft: -t.space.md },
  bar: { flex: 1, flexDirection: 'row', gap: t.space.xs },
  segment: { flex: 1, height: t.size.track, borderRadius: t.radius.pill, backgroundColor: t.colors.line },
  done: { backgroundColor: t.colors.ink },
}));

/** « ‹ 2 sur 4 » et la barre segmentée de l'onboarding (`210`). */
export function StepHeader({ step, total, label, onBack }: StepHeaderProps) {
  const styles = useStyles();
  const { colors, size, opacity } = useTheme();
  return (
    <View style={styles.row} testID="step-header">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Étape précédente"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && { opacity: opacity.pressed }]}>
          <ChevronLeft color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
        </Pressable>
      ) : null}
      <Text role="caption" color="inkSecondary">
        {label}
      </Text>
      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: total, now: step }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} testID={i < step ? 'step-done' : 'step-todo'} style={[styles.segment, i < step && styles.done]} />
        ))}
      </View>
    </View>
  );
}
