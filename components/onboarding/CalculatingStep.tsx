import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Label } from '@/components/ui/Label';

type CalculatingStepProps = {
  firstName: string;
  onDone: () => void;
};

const DURATION_MS = 3000;

export function CalculatingStep({ firstName, onDone }: CalculatingStepProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: DURATION_MS, easing: Easing.inOut(Easing.cubic) }));
    const timer = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone();
    }, DURATION_MS + 300);
    return () => clearTimeout(timer);
  }, [progress, onDone]);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View className="flex-1 justify-center gap-8">
      <View className="gap-3">
        <Label>Bienvenue {firstName}</Label>
        <Text className="text-3xl font-semibold tracking-tight text-fg">
          Calcul de votre plan personnalisé...
        </Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-fg/10">
        <Animated.View className="h-3 rounded-full bg-accent" style={barStyle} />
      </View>
    </View>
  );
}
