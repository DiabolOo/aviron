import { useEffect, useState } from 'react';
import { type TextProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { countValue } from '@/src/core/motion';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';

type CountUpProps = TextProps & {
  value: number;
  className?: string;
  format?: (n: number) => string;
  durationMs?: number;
};

export function CountUp({ value, format, durationMs = 1600, ...props }: CountUpProps) {
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState(0);
  const shown = reduced ? value : animated;

  useEffect(() => {
    if (reduced) return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setAnimated(countValue(value, elapsed, durationMs));
      if (elapsed >= durationMs) clearInterval(id);
    }, 33);
    return () => clearInterval(id);
  }, [value, durationMs, reduced]);

  return <Text {...props}>{format ? format(shown) : String(shown)}</Text>;
}
