import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { axisKmLabel, monotonePath, nearestPointIndex, paceCurveModel, tooltipLabel } from '@/src/core/paceCurve';
import { formatSecAsClock } from '@/src/core/sportFormat';
import type { ActivitySplit } from '@/src/core/types';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useTheme } from '@/src/ui/useTheme';

const HEIGHT = 190;
const PAD = { left: 46, right: 14, top: 22, bottom: 26 };
const BAR_WIDTH = 14;
const TOOLTIP_WIDTH = 210;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  splits: ActivitySplit[];
  /** couleur du sport (token de thème) */
  color: string;
  /** allure moyenne = temps de déplacement / distance, identique au chiffre clé */
  avgPaceSec?: number;
  /** km du moment fort : seul point accentué de la courbe */
  highlightKm?: number;
  /** course : le dernier libellé d'axe devient « arrivée » */
  race?: boolean;
};

/**
 * Courbe d'allure par km : axe inversé (plus haut = plus rapide), moyenne en pointillé avec son libellé.
 * Interpolation monotone (jamais au-delà des points réels), un petit point par km, un point accentué (moment fort).
 * Au toucher / glissement : info-bulle « Km 14 · 5:12 /km ». Moins de 5 points : barres.
 * Se dessine une seule fois à l'ouverture ; affichage direct avec « Réduire les animations ».
 */
export function PaceCurve({ splits, color, avgPaceSec, highlightKm, race = false }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(reduced ? 1 : withDelay(250, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
  }, [reduced, progress]);

  const model = paceCurveModel(splits, width, HEIGHT, PAD, avgPaceSec);
  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: (model?.length ?? 0) * (1 - progress.get()),
  }));
  const dotProps = useAnimatedProps(() => ({
    fillOpacity: Math.min(1, Math.max(0, (progress.get() - 0.7) / 0.3)),
  }));
  const accent = model?.points.find((p) => p.km === highlightKm);
  const active = model && activeIndex !== null ? model.points[activeIndex] : undefined;

  const touchAt = (x: number) => {
    if (model) setActiveIndex(nearestPointIndex(model.points, x));
  };
  const clear = () => setActiveIndex(null);

  return (
    <Card className="mt-3 px-3 py-4">
      <Text className="px-2 text-sm text-muted">↑ plus rapide</Text>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onTouchStart={(e) => touchAt(e.nativeEvent.locationX)}
        onTouchMove={(e) => touchAt(e.nativeEvent.locationX)}
        onTouchEnd={clear}
        onTouchCancel={clear}
        testID="pace-curve">
        {model ? (
          <Svg width={width} height={HEIGHT}>
            {model.ticks.map((t) => (
              <Line
                key={t.paceSec}
                x1={PAD.left}
                x2={width - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke={colors.fg}
                strokeOpacity={0.08}
                strokeWidth={1}
              />
            ))}
            <Line
              x1={PAD.left}
              x2={width - PAD.right - 56}
              y1={model.avgY}
              y2={model.avgY}
              stroke={colors.fg}
              strokeOpacity={0.4}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            <SvgText
              x={width - PAD.right}
              y={model.avgY + 4}
              fontSize={13}
              fontWeight="600"
              fill={colors.fg}
              textAnchor="end">
              {`moy. ${formatSecAsClock(model.avgPaceSec)}`}
            </SvgText>
            {model.ticks.map((t) => (
              <SvgText key={t.paceSec} x={PAD.left - 8} y={t.y + 4} fontSize={12} fill={colors.muted} textAnchor="end">
                {formatSecAsClock(t.paceSec)}
              </SvgText>
            ))}
            <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={12} fill={colors.muted} textAnchor="start">
              {axisKmLabel(model.points[0].km)}
            </SvgText>
            <SvgText x={width - PAD.right} y={HEIGHT - 6} fontSize={12} fill={colors.muted} textAnchor="end">
              {axisKmLabel(model.points[model.points.length - 1].km, race)}
            </SvgText>
            {model.mode === 'curve' ? (
              <AnimatedPath
                d={monotonePath(model.points)}
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={[model.length, model.length]}
                animatedProps={lineProps}
              />
            ) : (
              model.points.map((p) => (
                <Rect
                  key={p.km}
                  x={p.x - BAR_WIDTH / 2}
                  y={p.y}
                  width={BAR_WIDTH}
                  height={Math.max(2, model.baseY - p.y)}
                  rx={BAR_WIDTH / 2}
                  fill={p.km === highlightKm ? color : colors.fg}
                  fillOpacity={p.km === highlightKm ? 1 : 0.2}
                />
              ))
            )}
            {model.mode === 'curve'
              ? model.points.map((p) =>
                  p === accent ? null : <Circle key={p.km} cx={p.x} cy={p.y} r={2.5} fill={colors.muted} />,
                )
              : null}
            {active ? (
              <Line
                x1={active.x}
                x2={active.x}
                y1={PAD.top}
                y2={model.baseY}
                stroke={colors.fg}
                strokeOpacity={0.25}
                strokeWidth={1}
              />
            ) : null}
            {active && active !== accent ? (
              <Circle cx={active.x} cy={active.y} r={4.5} fill={colors.fg} stroke={colors.surface} strokeWidth={2} />
            ) : null}
            {accent && model.mode === 'curve' ? (
              <AnimatedCircle
                testID="pace-curve-point"
                cx={accent.x}
                cy={accent.y}
                r={6}
                fill={color}
                stroke={colors.surface}
                strokeWidth={2.5}
                animatedProps={dotProps}
              />
            ) : null}
          </Svg>
        ) : (
          <View style={{ height: HEIGHT }} />
        )}
        {active ? (
          <View
            pointerEvents="none"
            className="absolute rounded-full bg-fg px-3 py-1"
            style={{ top: 0, left: Math.min(Math.max(active.x - TOOLTIP_WIDTH / 2, 0), Math.max(0, width - TOOLTIP_WIDTH)) }}>
            <Text testID="pace-curve-tooltip" numberOfLines={1} className="text-xs font-semibold text-canvas">
              {tooltipLabel(active)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
