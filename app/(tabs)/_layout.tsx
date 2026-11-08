import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/ui/TabBar';
import { makeStyles } from '@/src/design';
import { ProposalUndoToast } from '@/src/screens/coach/ProposalUndoToast';

const useStyles = makeStyles(() => ({ root: { flex: 1 } }));

export default function TabLayout() {
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
        <Tabs.Screen name="(semaine)" options={{ title: 'Semaine' }} />
        <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
        <Tabs.Screen name="(progres)" options={{ title: 'Progrès' }} />
      </Tabs>
      <ProposalUndoToast />
    </View>
  );
}
