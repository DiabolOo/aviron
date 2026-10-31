import { View } from 'react-native';

import { ModuleSwitcher } from '@/components/ui/ModuleSwitcher';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';

export default function PlanScreen() {
  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ScreenTitle title="Plan" />
        <ModuleSwitcher scope="plan" section="plans" order={['sport', 'nutrition', 'goals']} />
      </View>
    </Screen>
  );
}
