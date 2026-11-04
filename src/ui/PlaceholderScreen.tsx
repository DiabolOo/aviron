import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, textStyle, useTheme } from '@/src/design';

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  safe: { flex: 1, paddingHorizontal: t.space.screen, paddingTop: t.space.lg, gap: t.space.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.lg },
  title: { ...textStyle('title', 'bold'), color: t.colors.ink, flexShrink: 1 },
  body: { ...textStyle('body', 'regular'), color: t.colors.inkSecondary },
}));

type Props = { title: string; action?: ReactNode };

/** Écran provisoire de la coquille de navigation : remplacé par l'écran définitif à l'étape 5. */
export function PlaceholderScreen({ title, action }: Props) {
  const styles = useStyles();
  const { typography } = useTheme();
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.head}>
          <Text maxFontSizeMultiplier={typography.title.maxFontSizeMultiplier} style={styles.title}>
            {title}
          </Text>
          {action}
        </View>
        <Text style={styles.body}>Écran en cours de refonte</Text>
      </SafeAreaView>
    </View>
  );
}
