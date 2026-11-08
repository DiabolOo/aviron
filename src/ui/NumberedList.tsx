import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type NumberedItem = {
  id: string;
  /** « Départ · km 0 à 5,3 · 5:55 /km ». */
  title: string;
  /** « 33 s plus lent que ta moyenne : près de 3 minutes laissées là. » */
  body?: string;
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.lg },
  item: { flexDirection: 'row', gap: t.space.md },
  badge: {
    width: t.size.icon,
    height: t.size.icon,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.coach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: t.space.xs },
}));

/** Les temps du débrief, numérotés comme les repères du graphique (`212`). */
export function NumberedList({ items }: { items: readonly NumberedItem[] }) {
  const styles = useStyles();
  return (
    <View style={styles.root} testID="numbered-list">
      {items.map((item, i) => (
        <View key={item.id} style={styles.item} accessible accessibilityLabel={`${i + 1}. ${item.title}${item.body ? `. ${item.body}` : ''}`}>
          <View style={styles.badge}>
            <Text role="caption" weight="semibold" color="onCoach">
              {String(i + 1)}
            </Text>
          </View>
          <View style={styles.text}>
            <Text role="sub" weight="semibold">
              {item.title}
            </Text>
            {item.body ? (
              <Text role="sub" color="inkSecondary">
                {item.body}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
