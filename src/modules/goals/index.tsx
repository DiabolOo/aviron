import { Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { LifeModule } from '@/src/modules/types';
import { useTheme } from '@/src/ui/useTheme';

function ComingSoon() {
  const { colors } = useTheme();
  return (
    <Card className="items-center gap-3 py-10">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-chip">
        <Target color={colors.iris} size={26} strokeWidth={1.9} />
      </View>
      <Text className="text-[19px] font-semibold text-fg">Objectifs</Text>
      <Text className="text-center text-[16px] text-muted">
        Étapes et progression arrivent bientôt.
      </Text>
    </Card>
  );
}

export const goalsModule: LifeModule = {
  id: 'goals',
  title: 'Objectifs',
  description: 'Étapes et progression',
  icon: Target,
  color: 'iris',
  enabledByDefault: false,
  entities: [],
  todayWidgets: [],
  plans: [{ id: 'goals-plan', title: 'Objectifs', Component: ComingSoon }],
  dashboards: [{ id: 'goals', title: 'Objectifs', Component: ComingSoon }],
  agentTools: [],
  analyzers: [],
};
