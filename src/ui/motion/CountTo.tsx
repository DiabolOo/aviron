import { useEffect, useState } from 'react';
import { type TextProps } from 'react-native';
import { Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

type CountToProps = TextProps & {
  value: number;
  format: (n: number) => string;
  className?: string;
  durationMs?: number;
};

/** Nombre qui monte de 0 à `value` une seule fois, à l'ouverture. Affichage direct si « Réduire les animations ». */
export function CountTo({ value, format, durationMs = 700, ...props }: CountToProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    if (reduced) {
      progress.set(1);
      return;
    }
    progress.set(0);
    progress.set(withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) }));
  }, [value, durationMs, reduced, progress]);

  useAnimatedReaction(
    () => progress.get(),
    (p) => {
      scheduleOnRN(setRatio, p);
    },
  );

  return <Text {...props}>{format(value * (reduced ? 1 : ratio))}</Text>;
}
