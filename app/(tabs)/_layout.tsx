import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { TabBar } from '@/components/ui/TabBar';
import { UndoToast } from '@/src/ui/proposals/UndoToast';

export default function TabLayout() {
  return (
    <View className="flex-1">
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
        <Tabs.Screen name="sport" options={{ title: 'Sport' }} />
        <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
        <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
      </Tabs>
      <UndoToast />
    </View>
  );
}
