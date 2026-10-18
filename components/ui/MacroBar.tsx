import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { clampRatio } from '@/lib/format';

type MacroBarProps = {
  label: string;
  value: number;
  target?: number;
  accentClass: string;
};

export function MacroBar({ label, value, target, accentClass }: MacroBarProps) {
  const ratio = target ? clampRatio(value, target) : 1;
  const reached = !!target && ratio >= 1;

  return (
    <View className="flex-1">
      <Label>{label}</Label>
      <Text className="mt-2 text-lg font-semibold text-fg">
        {Math.round(value)}
        <Text className="text-sm font-medium text-muted">
          {target ? ` / ${Math.round(target)} g` : ' g'}
        </Text>
      </Text>
      <View
        className={`mt-2 h-2 overflow-hidden rounded-full bg-fg/10 ${
          reached ? 'border border-fg/20' : ''
        }`}>
        <View
          className={`h-full rounded-full ${accentClass}`}
          style={{ width: `${ratio * 100}%` }}>
          {reached ? <View className="mx-1 mt-px h-[2px] rounded-full bg-white/50" /> : null}
        </View>
      </View>
    </View>
  );
}
