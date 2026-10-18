import { useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glow } from '@/components/ui/Glow';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  withSafeBottom?: boolean;
};

export function Screen({ children, scroll = true, withSafeBottom = false }: ScreenProps) {
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.set(0);
      progress.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    }, [progress]),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-10 pt-4"
      showsVerticalScrollIndicator={false}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </ScrollView>
  ) : (
    <Animated.View className="flex-1 px-6 pb-4 pt-4" style={animatedStyle}>
      {children}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-canvas">
      <Glow />
      <SafeAreaView className="flex-1" edges={withSafeBottom ? ['top', 'bottom'] : ['top']}>
        {content}
      </SafeAreaView>
    </View>
  );
}
