import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useTheme } from '@/lib/useTheme';

export function AnalyzingState() {
  const { colors } = useTheme();
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View className="flex-1 items-center justify-center">
      <Animated.View style={{ transform: [{ rotate }] }}>
        <ProgressRing
          size={96}
          strokeWidth={4}
          progress={0.25}
          color={colors.accent}
          trackColor={colors.track}
        />
      </Animated.View>
      <Label className="mt-10">Analyse IA</Label>
      <Text className="mt-2 text-2xl font-semibold tracking-tight text-fg">
        Lecture de l’assiette…
      </Text>
    </View>
  );
}
