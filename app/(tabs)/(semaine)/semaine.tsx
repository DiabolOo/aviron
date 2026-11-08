import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MODULES } from '@/src/modules';
import { collectSections } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { makeStyles, textStyle, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';
import { useTabBarInset } from '@/src/ui/useTabBarInset';

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  title: { ...textStyle('title', 'bold'), color: t.colors.ink, paddingTop: t.space.xl },
}));

export default function WeekScreen() {
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();
  const isEnabled = useIsModuleEnabled();
  const sections = collectSections(MODULES, isEnabled, 'week');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
          showsVerticalScrollIndicator={false}>
          <Text role="title" weight="bold" style={styles.title}>Semaine</Text>
          {sections.map((section) => (
            <section.Component key={section.id} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
