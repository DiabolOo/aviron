import { type ReactNode, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

type FadeSlideProps = { children: ReactNode; delayMs?: number; className?: string };

/** Fondu + léger glissement vers le haut, une seule fois à l'ouverture. */
export function FadeSlide({ children, delayMs = 150, className }: FadeSlideProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      reduced ? 1 : withDelay(delayMs, withTiming(1, { duration: 500, easing: Easing.bezier(0.16, 1, 0.3, 1) })),
    );
  }, [delayMs, progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 14 }],
  }));

  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}
