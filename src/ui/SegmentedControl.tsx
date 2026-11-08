import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type SegmentedControlProps<T extends string> = {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    padding: t.space.xs,
    gap: t.space.xs,
    borderRadius: t.radius.pill,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
  },
  segment: {
    flex: 1,
    minHeight: t.size.buttonCompact,
    paddingHorizontal: t.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.pill,
  },
  on: { backgroundColor: t.colors.buttonPrimary },
}));

/** « Semaine · Mois · Année » : le segment choisi est plein, en encre (`211`). */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const styles = useStyles();
  const { opacity } = useTheme();
  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            testID={`segment-${o.id}`}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.id)}
            style={({ pressed }) => [styles.segment, on && styles.on, pressed && { opacity: opacity.pressed }]}>
            <Text role="sub" weight="semibold" color={on ? 'onButtonPrimary' : 'inkSecondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
