import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useTheme } from '@/src/ui/useTheme';

function Ripple({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 4400, easing: Easing.bezier(0.2, 0.6, 0.3, 1) }), -1),
      ),
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - t.get()),
    transform: [{ scale: 0.55 + t.get() * 1.15 }],
  }));

  return (
    <Animated.View
      className="absolute inset-0 rounded-full"
      style={[{ borderWidth: 2, borderColor: color }, style]}
    />
  );
}

export function Ripples() {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  if (reduced) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden rounded-3xl">
      <View className="absolute -right-10 -top-10 h-[180px] w-[180px]">
        {[0, 700, 3000].map((delay) => (
          <Ripple key={delay} delay={delay} color={`${colors.sport}59`} />
        ))}
      </View>
    </View>
  );
}
