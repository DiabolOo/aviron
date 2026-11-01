import { memo, useEffect, useState } from 'react';
import { type TextProps } from 'react-native';
import { Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

type AnimatedNumberProps = TextProps & {
  value: number;
  /** formate la valeur à chaque image : « 45:18 », « 9,1 »… le format reste respecté pendant la montée */
  format: (n: number) => string;
  className?: string;
  durationMs?: number;
};

const TABULAR = { fontVariant: ['tabular-nums' as const] };

/**
 * Nombre qui monte de 0 à `value` une seule fois, à l'ouverture. Composant isolé : l'état de l'animation
 * est local, le parent ne se re-rend pas à chaque image. Affichage direct avec « Réduire les animations ».
 */
function AnimatedNumberBase({ value, format, durationMs = 700, style, ...props }: AnimatedNumberProps) {
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

  return (
    <Text {...props} style={[TABULAR, style]}>
      {format(value * (reduced ? 1 : ratio))}
    </Text>
  );
}

export const AnimatedNumber = memo(AnimatedNumberBase);
