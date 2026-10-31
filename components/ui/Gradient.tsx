import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

type GradientProps = {
  colors: readonly [string, string];
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  vertical?: boolean;
  horizontal?: boolean;
};

export function Gradient({ colors, children, style, vertical, horizontal }: GradientProps) {
  const start = vertical ? { x: 0, y: 1 } : horizontal ? { x: 0, y: 0 } : { x: 0, y: 0 };
  const end = vertical ? { x: 0, y: 0 } : horizontal ? { x: 1, y: 0 } : { x: 1, y: 1 };
  return (
    <LinearGradient colors={[colors[0], colors[1]]} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}
