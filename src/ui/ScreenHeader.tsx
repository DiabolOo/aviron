import { Pressable, View } from 'react-native';

import { makeStyles, useFontScale, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type ScreenHeaderProps = {
  /** « Semaine », « Bonjour, Jul ». */
  title: string;
  /** Phrase de rôle : « Prévu et fait, jour par jour. » */
  subtitle?: string;
  /** Surtitre d'Aujourd'hui : « Lundi 2 novembre · phase de base ». */
  eyebrow?: string;
  /** Lien souligné à droite : « Historique ». */
  action?: { label: string; onPress: () => void };
  /** Avatar d'Aujourd'hui (initiale) : ouvre le profil. */
  avatar?: { initial: string; onPress: () => void; accessibilityLabel?: string };
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: t.space.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  text: { flexShrink: 1, gap: t.space.xs },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  avatar: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stacked: { gap: t.space.sm },
}));

/** En-tête d'onglet : titre, phrase de rôle, action ou avatar à droite. */
export function ScreenHeader({ title, subtitle, eyebrow, action, avatar }: ScreenHeaderProps) {
  const styles = useStyles();
  const { opacity, fontScaleBreakpoints } = useTheme();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;

  const text = (
    <View style={styles.text}>
      {eyebrow ? (
        <Text role="sub" weight="semibold" color="inkSecondary">
          {eyebrow}
        </Text>
      ) : null}
      <Text role="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text role="body" color="inkSecondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
  const side = avatar ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={avatar.accessibilityLabel ?? 'Ouvrir le profil'}
      onPress={avatar.onPress}
      testID="avatar-button"
      style={({ pressed }) => [styles.avatar, pressed && { opacity: opacity.pressed }]}>
      <Text role="body" weight="semibold" color="onButtonPrimary">
        {avatar.initial}
      </Text>
    </Pressable>
  ) : action ? (
    <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.link}>
      <Text role="body" weight="semibold" style={styles.underline}>
        {action.label}
      </Text>
    </Pressable>
  ) : null;

  if (stacked && !avatar) {
    return (
      <View style={styles.stacked} testID="screen-header">
        {text}
        {side}
      </View>
    );
  }
  return (
    <View style={avatar ? styles.rowCenter : styles.row} testID="screen-header">
      {text}
      {side}
    </View>
  );
}
