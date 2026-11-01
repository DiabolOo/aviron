import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { staggerDelay } from '@/src/core/motion';
import { analyzeSplits } from '@/src/core/sportFormat';
import type { ActivitySplit } from '@/src/core/types';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const BODY = 'text-[16px]';
const HEAD = 'text-[12px] text-muted';
const BAR_MIN_SCREEN_WIDTH = 380;

function SplitBar({ widthPct, fastest, index }: { widthPct: number; fastest: boolean; index: number }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.set(
      reduced ? 1 : withDelay(staggerDelay(index, 40), withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })),
    );
  }, [grow, index, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.get() }] }));

  return (
    <Animated.View
      testID="split-bar"
      className={`h-full rounded-full ${fastest ? 'bg-accent' : 'bg-fg/30'}`}
      style={[{ width: `${widthPct}%`, transformOrigin: 'left' }, style]}
    />
  );
}

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
      {splits.map((split, index) => {
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
                    <SplitBar widthPct={30 + ratio * 70} fastest={isFastest} index={index} />
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
