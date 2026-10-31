import { View } from 'react-native';

import { ModuleSwitcher } from '@/components/ui/ModuleSwitcher';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';

export default function TrackingScreen() {
  return (
    <Screen tone="suivi">
      <View className="gap-3.5">
        <ScreenTitle title="Suivi" />
        <ModuleSwitcher scope="suivi" section="dashboards" order={['nutrition', 'sport', 'goals']} />
      </View>
    </Screen>
  );
}
