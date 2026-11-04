import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { makeStyles, textStyle } from '@/src/design';
import { PlaceholderScreen } from '@/src/ui/PlaceholderScreen';

const useStyles = makeStyles((t) => ({
  avatar: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { ...textStyle('sub', 'semibold'), color: t.colors.ink },
}));

/** Avatar provisoire : ouvre le profil (Stack hors onglets). Remplacé à l'étape 5. */
function ProvisionalAvatar() {
  const styles = useStyles();
  const firstName = usePulseFitStore((s) => s.profile.firstName);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le profil"
      hitSlop={4}
      onPress={() => router.push('/profile')}
      style={styles.avatar}>
      <Text style={styles.initial}>{firstName.charAt(0).toUpperCase()}</Text>
    </Pressable>
  );
}

export default function TodayScreen() {
  return <PlaceholderScreen title="Aujourd’hui" action={<ProvisionalAvatar />} />;
}
