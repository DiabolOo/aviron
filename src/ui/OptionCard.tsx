import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type OptionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

const useStyles = makeStyles((t) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    minHeight: t.size.button,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    borderRadius: t.radius.control,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
  },
  // Le contour épais ne doit pas décaler le contenu : on retire la différence au padding.
  on: {
    borderWidth: t.size.outlineStrong,
    borderColor: t.colors.ink,
    paddingHorizontal: t.space.lg - (t.size.outlineStrong - t.size.hairline),
    paddingVertical: t.space.md - (t.size.outlineStrong - t.size.hairline),
  },
  text: { flex: 1, gap: t.space.xs },
  radio: {
    width: t.size.icon,
    height: t.size.icon,
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: t.colors.ink, borderColor: t.colors.ink },
  inner: { width: t.size.pillDot, height: t.size.pillDot, borderRadius: t.radius.pill, backgroundColor: t.colors.surface },
}));

/** Un choix de l'onboarding ou du profil : titre, description, rond à droite ; choisi = contour encre épais (`210`). */
export function OptionCard({ title, description, selected, onPress, testID }: OptionCardProps) {
  const styles = useStyles();
  const { opacity } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.on, pressed && { opacity: opacity.pressed }]}>
      <View style={styles.text}>
        <Text role="body" weight="semibold">
          {title}
        </Text>
        {description ? (
          <Text role="sub" color="inkSecondary">
            {description}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.inner} /> : null}</View>
    </Pressable>
  );
}
