import { useWindowDimensions, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { analyzeSplits } from '@/src/core/sportFormat';
import type { ActivitySplit } from '@/src/core/types';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const BODY = 'text-[16px]';
const HEAD = 'text-[12px] text-muted';
const BAR_MIN_SCREEN_WIDTH = 380;

export function SplitsList({ splits }: { splits: ActivitySplit[] }) {
  const { width } = useWindowDimensions();
  if (splits.length === 0) return null;
  const showBar = width >= BAR_MIN_SCREEN_WIDTH;
  const { stops, fastest, slowest } = analyzeSplits(splits);

  return (
    <Card className="mt-3">
      <View className="flex-row items-center gap-3 pb-3">
        <Text numberOfLines={1} ellipsizeMode="clip" className={`w-8 ${HEAD}`}>Km</Text>
        <Text numberOfLines={1} ellipsizeMode="clip" className={`flex-1 ${HEAD}`}>Allure (min/km)</Text>
        <Text numberOfLines={1} ellipsizeMode="clip" className={`w-14 text-right ${HEAD}`}>D+</Text>
        <Text numberOfLines={1} ellipsizeMode="clip" className={`w-10 text-right ${HEAD}`}>FC</Text>
      </View>
      {splits.map((split) => {
        const stopped = stops.has(split.km);
        const isFastest = !stopped && split.paceSec === fastest;
        const ratio =
          fastest === undefined || slowest === undefined || slowest === fastest
            ? 1
            : 1 - (split.paceSec - fastest) / (slowest - fastest);
        return (
          <View key={split.km} className="flex-row items-center gap-3 border-t border-fg/5 py-3">
            <Text numberOfLines={1} ellipsizeMode="clip" style={TABULAR} className={`w-8 text-muted ${BODY}`}>
              {`${split.km}`.padStart(2, '0')}
            </Text>
            <View className="flex-1 flex-row items-center gap-3">
              <Text
                numberOfLines={1}
                ellipsizeMode="clip"
                style={TABULAR}
                className={`w-14 ${BODY} ${stopped ? 'text-muted' : isFastest ? 'font-semibold text-fg' : 'text-fg'}`}>
                {stopped ? 'arrêt' : split.pace}
              </Text>
              {showBar ? (
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/5">
                  {stopped ? null : (
                    <View
                      testID="split-bar"
                      className={`h-full rounded-full ${isFastest ? 'bg-accent' : 'bg-fg/30'}`}
                      style={{ width: `${30 + ratio * 70}%` }}
                    />
                  )}
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} ellipsizeMode="clip" style={TABULAR} className={`w-14 text-right text-muted ${BODY}`}>
              {split.elevationGain} m
            </Text>
            <Text numberOfLines={1} ellipsizeMode="clip" style={TABULAR} className={`w-10 text-right text-muted ${BODY}`}>
              {split.avgHr ?? ''}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}
