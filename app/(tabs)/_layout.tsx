import { Tabs } from 'expo-router';

import { TabBar } from '@/components/ui/TabBar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="training" options={{ title: 'Entraînement' }} />
    </Tabs>
  );
}
