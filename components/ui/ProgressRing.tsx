import { type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type ProgressRingProps = {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color: string;
  trackColor?: string;
  children?: ReactNode;
};

export function ProgressRing({
  size = 132,
  strokeWidth = 11,
  progress,
  color,
  trackColor = 'rgba(255,255,255,0.08)',
  children,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const reached = clamped >= 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {reached ? (
          <>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeOpacity={0.12}
              strokeWidth={strokeWidth + 8}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeOpacity={0.22}
              strokeWidth={strokeWidth + 4}
              fill="none"
            />
          </>
        ) : null}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children}
    </View>
  );
}
