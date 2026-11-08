import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles, textStyle, useTheme } from '@/src/design';

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  safe: { flex: 1, paddingHorizontal: t.space.screen, paddingTop: t.space.lg, gap: t.space.sm },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: t.size.touchMin },
  backLabel: { ...textStyle('body', 'semibold'), color: t.colors.ink },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.lg },
  title: { ...textStyle('title', 'bold'), color: t.colors.ink, flexShrink: 1 },
  body: { ...textStyle('body', 'regular'), color: t.colors.inkSecondary },
}));

/** `back` : libellé du retour (« ‹ Cette semaine »), pour un écran empilé. */
type Props = { title: string; action?: ReactNode; back?: string };

/** Écran provisoire de la coquille de navigation : remplacé par l'écran définitif à l'étape 5. */
export function PlaceholderScreen({ title, action, back }: Props) {
  const styles = useStyles();
  const { colors, opacity, size, typography } = useTheme();
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Retour : ${back}`}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && { opacity: opacity.pressed }]}>
            <ChevronLeft color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
            <Text style={styles.backLabel}>{back}</Text>
          </Pressable>
        ) : null}
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
