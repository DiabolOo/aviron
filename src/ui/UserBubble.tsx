import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: 'flex-end', maxWidth: '85%', gap: t.space.xs },
  stamp: { alignSelf: 'flex-end' },
  bubble: {
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceSunken,
  },
}));

/** Ce que l'utilisateur a demandé au coach. */
export function UserBubble({ text, stamp }: { text: string; stamp?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Toi${stamp ? `, ${stamp}` : ''} : ${text}`} testID="user-bubble">
      <View style={styles.bubble}>
        <Text role="body">{text}</Text>
      </View>
      {stamp ? (
        <Text role="caption" color="inkTertiary" style={styles.stamp}>{`Toi · ${stamp}`}</Text>
      ) : null}
    </View>
  );
}
