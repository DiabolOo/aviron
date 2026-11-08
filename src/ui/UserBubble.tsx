import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

const useStyles = makeStyles((t) => ({
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceSunken,
  },
}));

/** Ce que l'utilisateur a demandé au coach. */
export function UserBubble({ text }: { text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.bubble} accessible accessibilityLabel={`Toi : ${text}`} testID="user-bubble">
      <Text role="body">{text}</Text>
    </View>
  );
}
