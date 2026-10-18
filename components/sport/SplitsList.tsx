import { Zap } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { ActivitySplit } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

export function SplitsList({ splits }: { splits: ActivitySplit[] }) {
  const { colors } = useTheme();
  const fastest = Math.min(...splits.map((s) => s.paceSec));
  const slowest = Math.max(...splits.map((s) => s.paceSec));

  return (
    <Card className="mt-3">
      <View className="flex-row pb-3">
        <Text className="w-10 font-mono text-[10px] uppercase tracking-[2px] text-muted">Km</Text>
        <Text className="flex-1 font-mono text-[10px] uppercase tracking-[2px] text-muted">Allure</Text>
        <Text className="w-14 text-right font-mono text-[10px] uppercase tracking-[2px] text-muted">D+</Text>
        <Text className="w-14 text-right font-mono text-[10px] uppercase tracking-[2px] text-muted">FC</Text>
      </View>
      {splits.map((split) => {
        const isFastest = split.paceSec === fastest;
        const ratio = slowest === fastest ? 1 : 1 - (split.paceSec - fastest) / (slowest - fastest);
        return (
          <View key={split.km} className="flex-row items-center border-t border-fg/5 py-3">
            <Text className="w-10 font-mono text-xs text-muted">{`${split.km}`.padStart(2, '0')}</Text>
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <Text className={`w-11 text-base ${isFastest ? 'font-semibold text-fg' : 'text-fg'}`}>
                {split.pace}
              </Text>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/5">
                <View
                  className={`h-full rounded-full ${isFastest ? 'bg-accent' : 'bg-fg/30'}`}
                  style={{ width: `${30 + ratio * 70}%` }}
                />
              </View>
              {isFastest ? <Zap color={colors.accent} size={14} strokeWidth={2} /> : <View className="w-3.5" />}
            </View>
            <Text className="w-14 text-right text-sm text-muted">{split.elevationGain} m</Text>
            <Text className="w-14 text-right text-sm text-muted">{split.avgHr}</Text>
          </View>
        );
      })}
    </Card>
  );
}
