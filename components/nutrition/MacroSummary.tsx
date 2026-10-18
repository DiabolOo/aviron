import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { MacroBar } from '@/components/ui/MacroBar';
import { clampRatio, formatKcal } from '@/lib/format';
import type { Macros } from '@/lib/types';

type MacroSummaryProps = {
  consumed: Macros;
  target: Macros;
};

export function MacroSummary({ consumed, target }: MacroSummaryProps) {
  return (
    <Card className="mt-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Label>Apports du jour</Label>
          <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">
            {formatKcal(consumed.calories)}
            <Text className="text-sm font-normal tracking-normal text-muted">
              {' '}
              / {formatKcal(target.calories)} kcal
            </Text>
          </Text>
        </View>
        <Text className="mb-1 font-mono text-xs text-muted">
          {Math.round(clampRatio(consumed.calories, target.calories) * 100)} %
        </Text>
      </View>
      <View className="mt-6 flex-row gap-6">
        <MacroBar label="Prot." value={consumed.protein} target={target.protein} accentClass="bg-accent" />
        <MacroBar label="Gluc." value={consumed.carbs} target={target.carbs} accentClass="bg-aqua" />
        <MacroBar label="Lip." value={consumed.fat} target={target.fat} accentClass="bg-iris" />
      </View>
    </Card>
  );
}
