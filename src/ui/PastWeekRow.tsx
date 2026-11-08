import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type PastWeekRowProps = {
  /** Période et résumé : « 19 – 25 oct. · 1 sortie, 15 min ». */
  title: string;
  /** « Jeu. 22 · course 2,8 km à 3:41 /km · sans cardio » ou « Rien d'importé ». */
  detail: string;
  onPress: () => void;
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md },
  main: { flex: 1, gap: t.space.xs },
}));

/** Une semaine passée : ouvre son détail (`104`). */
export function PastWeekRow({ title, detail, onPress }: PastWeekRowProps) {
  const styles = useStyles();
  const { colors, size, opacity } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: opacity.pressed }]}>
      <View style={styles.main}>
        <Text role="body" weight="semibold">
          {title}
        </Text>
        <Text role="sub" color="inkSecondary">
          {detail}
        </Text>
      </View>
      <ChevronRight color={colors.inkSecondary} size={size.icon} strokeWidth={size.iconStroke} />
    </Pressable>
  );
}
