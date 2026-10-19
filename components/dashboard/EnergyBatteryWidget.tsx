import { Zap } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { clampRatio } from '@/lib/format';
import type { WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type EnergyBatteryWidgetProps = {
  session?: WorkoutSession;
  consumedKcal: number;
  targetKcal: number;
};

const SEGMENTS = 10;

function computeEnergy(session: WorkoutSession | undefined, consumed: number, target: number) {
  const fuel = clampRatio(consumed, target);
  if (session?.completed) {
    return { level: Math.round(45 + fuel * 20), status: 'Post-effort : Récupération' };
  }
  const level = Math.round(70 + fuel * 20);
  return { level, status: level >= 80 ? 'Forme optimale' : 'Énergie correcte' };
}

export function EnergyBatteryWidget({ session, consumedKcal, targetKcal }: EnergyBatteryWidgetProps) {
  const { colors } = useTheme();
  const { level, status } = computeEnergy(session, consumedKcal, targetKcal);
  const filled = Math.round((level / 100) * SEGMENTS);

  return (
    <View
      accessibilityLabel={`Énergie ${level} pour cent, ${status}`}
      className="mt-10 flex-row items-center gap-4 rounded-3xl border border-fg/5 bg-surface p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-black">
        <Zap color={colors.accent} size={20} strokeWidth={2} fill={colors.accent} />
      </View>
      <View className="flex-1">
        <Label>Énergie</Label>
        <Text className="mt-1 text-base font-semibold text-fg">
          {level}%<Text className="font-normal text-muted"> • {status}</Text>
        </Text>
        <View className="mt-2 flex-row gap-1">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <View
              key={i}
              className={`h-2 flex-1 rounded-full ${i < filled ? 'bg-accent' : 'bg-fg/10'}`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
