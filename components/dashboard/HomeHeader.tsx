import { Flame } from 'lucide-react-native';
import { View } from 'react-native';

import { Gradient } from '@/components/ui/Gradient';
import { Text } from '@/components/ui/Text';
import { greetingForHour } from '@/src/core/dates';
import { FLAME_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type HomeHeaderProps = {
  firstName: string;
  streak: number;
};

export function HomeHeader({ firstName, streak }: HomeHeaderProps) {
  const { colors } = useTheme();
  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View className="mb-2 flex-row items-end justify-between">
      <View className="flex-1 gap-1.5 pr-3">
        <Text className="text-[16px] font-medium capitalize text-muted">{dateLabel}</Text>
        <Text numberOfLines={1} className="text-[34px] font-bold leading-[38px] tracking-tight text-fg">
          {greetingForHour(now.getHours())}, {firstName}
        </Text>
      </View>
      {streak > 0 ? (
        <View
          accessibilityLabel={`Série de ${streak} jours`}
          className="h-10 flex-row items-center gap-2 rounded-full border px-3.5"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.cardBorder }}>
          <Gradient colors={FLAME_GRADIENT} vertical style={{ width: 22, height: 22, borderRadius: 11 }}>
            <View className="h-full w-full items-center justify-center">
              <Flame color="#FFFFFF" size={14} strokeWidth={2.4} />
            </View>
          </Gradient>
          <Text className="text-[16px] font-semibold text-fg">
            {streak} {streak > 1 ? 'jours' : 'jour'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
