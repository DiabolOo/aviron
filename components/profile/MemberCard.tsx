import { Pencil } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import { TAB_ICONS } from '@/components/ui/tabIcons';
import { useTheme } from '@/lib/useTheme';

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
    { label: 'Activités', value: `${activities}`, unit: 'Strava' },
  ];

  return (
    <View className="mt-2 overflow-hidden rounded-3xl border border-iris/30 bg-surface p-5">
      <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-iris/10" />
      <View className="flex-row items-center justify-between">
        <Label>Membre PulseFit</Label>
        <IconButton label="Modifier le prénom" onPress={onEdit}>
          <Pencil color={colors.fg} size={16} strokeWidth={1.8} />
        </IconButton>
      </View>
      <View className="mt-3 flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-black">
          <TAB_ICONS.profil color={colors.accent} size={28} strokeWidth={1.9} />
        </View>
        <View className="flex-1">
          <Text className="text-3xl font-semibold tracking-tight text-fg">{firstName}</Text>
          <Text numberOfLines={2} className="mt-1 text-sm text-muted">
            {goalLabel}
          </Text>
        </View>
      </View>
      <View className="mt-5 flex-row border-t border-fg/5 pt-4">
        {stats.map((stat) => (
          <View key={stat.label} className="flex-1">
            <Text className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
              {stat.label}
            </Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-fg">
              {stat.value}
              <Text className="text-xs font-normal tracking-normal text-muted"> {stat.unit}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
