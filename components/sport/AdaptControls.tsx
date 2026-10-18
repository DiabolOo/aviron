import { Sparkles } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Segmented } from '@/components/ui/Segmented';
import type { FatigueLevel, TimeBudget } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type AdaptControlsProps = {
  fatigue: FatigueLevel;
  timeBudget: TimeBudget;
  isAdapting: boolean;
  onFatigue: (value: FatigueLevel) => void;
  onTime: (value: TimeBudget) => void;
  onAdapt: () => void;
};

const FATIGUE = [
  { id: 'fresh', label: 'Frais' },
  { id: 'ok', label: 'OK' },
  { id: 'tired', label: 'Fatigué' },
] as const satisfies readonly { id: FatigueLevel; label: string }[];

const TIMES = [
  { id: '30', label: '30′' },
  { id: '45', label: '45′' },
  { id: '60', label: '60′' },
  { id: '90', label: '90′' },
] as const satisfies readonly { id: TimeBudget; label: string }[];

export function AdaptControls({
  fatigue,
  timeBudget,
  isAdapting,
  onFatigue,
  onTime,
  onAdapt,
}: AdaptControlsProps) {
  const { colors } = useTheme();

  return (
    <Card className="mt-8">
      <View className="flex-row items-center gap-2">
        <Sparkles color={colors.fg} size={16} strokeWidth={1.8} />
        <Text className="text-base font-semibold text-fg">Adapter ma semaine</Text>
      </View>

      <Label className="mt-5">Forme</Label>
      <Segmented className="mt-2" options={FATIGUE} value={fatigue} onChange={onFatigue} />

      <Label className="mt-4">Temps max</Label>
      <Segmented className="mt-2" options={TIMES} value={timeBudget} onChange={onTime} />

      <View className="mt-5">
        <PrimaryButton
          variant="ghost"
          label={isAdapting ? 'Génération…' : 'Régénérer'}
          disabled={isAdapting}
          onPress={onAdapt}
        />
      </View>
    </Card>
  );
}
