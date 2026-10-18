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
  return (
    <View className="flex-1">
      <Label>{label}</Label>
      <Text className="mt-2 text-lg font-semibold text-fg">
        {Math.round(value)}
        <Text className="text-xs font-normal text-muted">
          {target ? ` / ${Math.round(target)} g` : ' g'}
        </Text>
      </Text>
      <View className="mt-2 h-1 overflow-hidden rounded-full bg-fg/10">
        <View
          className={`h-full rounded-full ${accentClass}`}
          style={{ width: `${(target ? clampRatio(value, target) : 1) * 100}%` }}
        />
      </View>
    </View>
  );
}
