import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { smoothPath } from '@/components/sport/SmoothPath';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { paceCurveModel, type CurvePoint } from '@/src/core/paceCurve';
import { formatSecAsClock } from '@/src/core/sportFormat';
import { estimateMaxHr, hrZones, zoneOf } from '@/src/core/training/engine';
import type { ActivitySplit } from '@/src/core/types';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useTheme } from '@/src/ui/useTheme';

const HEIGHT = 190;
const PAD = { left: 46, right: 14, top: 14, bottom: 26 };
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Dot({
  point,
  color,
  opacity,
  index,
  progress,
  count,
}: {
  point: CurvePoint;
  color: string;
  opacity: number;
  index: number;
  progress: ReturnType<typeof useSharedValue<number>>;
  count: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const start = index / count;
    const t = Math.min(1, Math.max(0, (progress.get() - start * 0.8) / 0.2));
    return { fillOpacity: opacity * t, r: 2 + 3 * t };
  });
  return <AnimatedCircle cx={point.x} cy={point.y} fill={color} animatedProps={animatedProps} />;
}

type Props = {
  splits: ActivitySplit[];
  /** FC max de l'athlète (observée) : si elle existe avec la FC des splits, la teinte suit la zone */
  maxHr?: number;
};

/**
 * Courbe d'allure par km : axe inversé (plus haut = plus rapide), allure moyenne en pointillé.
 * Une seule teinte, plus intense quand l'allure dépasse la moyenne ; si la FC existe, la teinte suit la zone.
 * Se dessine une seule fois à l'ouverture ; affichage direct avec « Réduire les animations ».
 */
export function PaceCurve({ splits, maxHr }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(reduced ? 1 : withDelay(250, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [reduced, progress]);

  const model = paceCurveModel(splits, width, HEIGHT, PAD);
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: (model?.length ?? 0) * (1 - progress.get()),
  }));

  const hasHr = splits.some((s) => s.avgHr !== undefined) && maxHr !== undefined && maxHr > 0;
  const zones = hasHr ? hrZones(maxHr ?? estimateMaxHr(35)) : undefined;
  const zoneColor = (hr: number | undefined): string => {
    if (!zones || hr === undefined) return colors.accent;
    const z = zoneOf(hr, zones);
    return z <= 2 ? colors.aqua : z === 3 ? colors.accent : colors.nutri;
  };

  return (
    <Card className="mt-3 px-3 py-4">
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} testID="pace-curve">
        {model ? (
          <Svg width={width} height={HEIGHT}>
            <Line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={model.avgY}
              y2={model.avgY}
              stroke={colors.fg}
              strokeOpacity={0.4}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            <SvgText x={PAD.left - 8} y={PAD.top + 4} fontSize={12} fill={colors.muted} textAnchor="end">
              {formatSecAsClock(model.fastestSec)}
            </SvgText>
            <SvgText x={PAD.left - 8} y={HEIGHT - PAD.bottom + 4} fontSize={12} fill={colors.muted} textAnchor="end">
              {formatSecAsClock(model.slowestSec)}
            </SvgText>
            <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={12} fill={colors.muted} textAnchor="start">
              {`km ${model.points[0].km}`}
            </SvgText>
            <SvgText x={width - PAD.right} y={HEIGHT - 6} fontSize={12} fill={colors.muted} textAnchor="end">
              {`km ${model.points[model.points.length - 1].km}`}
            </SvgText>
            <AnimatedPath
              d={smoothPath(model.points)}
              stroke={colors.accent}
              strokeOpacity={0.45}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={[model.length, model.length]}
              animatedProps={lineProps}
            />
            {model.points.map((pt, i) => (
              <Dot
                key={pt.km}
                point={pt}
                color={zoneColor(pt.avgHr)}
                opacity={hasHr ? 1 : pt.faster ? 1 : 0.4}
                index={i}
                count={model.points.length}
                progress={progress}
              />
            ))}
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
      </View>
      {model ? (
        <Text className="mt-2 px-2 text-sm text-muted">
          {`Plus haut = plus rapide · pointillé : allure moyenne ${formatSecAsClock(model.avgPaceSec)} /km`}
          {hasHr ? ' · couleur : zone de FC' : ''}
        </Text>
      ) : null}
    </Card>
  );
}
