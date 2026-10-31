import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/ui/TabBar';
import { UndoToast } from '@/src/ui/proposals/UndoToast';

export default function TabLayout() {
  return (
    <View className="flex-1">
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
        <Tabs.Screen name="agent" options={{ title: 'Agent' }} />
        <Tabs.Screen name="suivi" options={{ title: 'Suivi' }} />
        <Tabs.Screen name="moi" options={{ title: 'Moi' }} />
      </Tabs>
      <UndoToast />
    </View>
  );
}
