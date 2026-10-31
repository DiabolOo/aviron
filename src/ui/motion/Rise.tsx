import { type ReactNode, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { staggerDelay } from '@/src/core/motion';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

type RiseProps = { children: ReactNode; index?: number; className?: string };

export function Rise({ children, index = 0, className }: RiseProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      reduced
        ? 1
        : withDelay(
            staggerDelay(index),
            withTiming(1, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          ),
    );
  }, [index, progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { translateX: (1 - progress.get()) * 40 },
      { skewX: `${(1 - progress.get()) * -3}deg` },
    ],
  }));

  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}
