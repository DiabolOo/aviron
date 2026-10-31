import { Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { Gradient } from '@/components/ui/Gradient';
import { TAB_ICONS } from '@/components/ui/tabIcons';
import { AI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type MemberCardProps = {
  firstName: string;
  goalLabel: string;
  streak: number;
  sessionsDone: number;
  activities: number;
  onEdit: () => void;
};

export function MemberCard({
  firstName,
  goalLabel,
  streak,
  sessionsDone,
  activities,
  onEdit,
}: MemberCardProps) {
  const { colors } = useTheme();
  const stats = [
    { label: 'Série', value: `${streak}`, unit: streak > 1 ? 'jours' : 'jour' },
    { label: 'Séances', value: `${sessionsDone}`, unit: 'faites' },
    { label: 'Activités', value: `${activities}`, unit: 'importées' },
  ];

  return (
    <Card tint="ai">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-medium text-muted">Membre PulseFit</Text>
        <IconButton label="Modifier le profil" onPress={onEdit}>
          <Pencil color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>
      <View className="mt-3 flex-row items-center gap-4">
        <Gradient
          colors={AI_GRADIENT}
          style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}>
          <TAB_ICONS.moi color="#FFFFFF" size={28} strokeWidth={1.9} />
        </Gradient>
        <View className="flex-1">
          <Text className="text-3xl font-semibold tracking-tight text-fg">{firstName}</Text>
          <Text numberOfLines={2} className="mt-1 text-sm text-muted">
            {goalLabel}
          </Text>
        </View>
      </View>
      <View className="mt-5 flex-row rounded-2xl bg-fg/5 px-4 py-3">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1">
            <Text className="font-mono text-[13px] text-muted">
              {stat.label}
            </Text>
            <Text className="mt-1 text-3xl font-semibold tracking-tight text-fg">
              {stat.value}
              <Text className="text-xs font-normal tracking-normal text-muted"> {stat.unit}</Text>
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
