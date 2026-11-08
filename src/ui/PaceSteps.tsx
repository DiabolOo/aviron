import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { fontFamily, makeStyles, typography, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type Step = { fromKm: number; toKm: number; value: number };

export type PaceStepsProps = {
  /** Allure en marches, en s/km (plus petit = plus vite = plus haut). */
  pace: readonly Step[];
  /** FC en bpm, pointillés (plus haut = plus haute) ; absente sans cardio. */
  hr?: readonly Step[];
  /** Allure moyenne en s/km : tirets fins. */
  averageSec?: number;
  /** Objectif en s/km : tirets `coach`, libellé « objectif 4:59 ». */
  target?: { valueSec: number; label: string };
  /** Repères numérotés posés sur l'allure, au km donné. */
  markers?: readonly { km: number; label: string }[];
  /** « ↑ plus vite » ou « — allure ↑ plus vite · ··· FC ↑ plus haute ». */
  legend: string;
  /** « moy. 5:22 ». */
  averageLabel?: string;
  /** « km 0 », « km 10,5 », « km 21,1 ». */
  axis: readonly string[];
  accessibilityLabel: string;
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.sm },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: t.space.md },
  chart: { height: t.chart.steps },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
}));

const stepPath = (steps: readonly Step[], x: (km: number) => number, y: (v: number) => number) =>
  steps
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.fromKm)},${y(s.value)} L${x(s.toKm)},${y(s.value)}`)
    .join(' ');

/** Graphique du débrief : l'allure en marches sur la distance, repères 1-2-3 (`212`). */
export function PaceSteps({ pace, hr, averageSec, target, markers = [], legend, averageLabel, axis, accessibilityLabel }: PaceStepsProps) {
  const styles = useStyles();
  const { colors, chart, size } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const height = chart.steps;
  const pad = size.icon / 2 + chart.stroke;
  const totalKm = Math.max(0, ...pace.map((s) => s.toKm));
  const x = (km: number) => pad + (totalKm > 0 ? (km / totalKm) * (width - 2 * pad) : 0);

  const paceValues = [...pace.map((s) => s.value), ...(averageSec ? [averageSec] : []), ...(target ? [target.valueSec] : [])];
  const fast = Math.min(...paceValues);
  const slow = Math.max(...paceValues);
  const span = slow - fast || 1;
  const top = pad + typography.caption.lineHeight;
  const yPace = (sec: number) => top + ((sec - fast) / span) * (height - top - pad);

  const hrValues = hr?.map((s) => s.value) ?? [];
  const hrLow = Math.min(...hrValues);
  const hrSpan = Math.max(...hrValues) - hrLow || 1;
  const yHr = (bpm: number) => height - pad - ((bpm - hrLow) / hrSpan) * (height - top - pad);

  const markerY = (km: number) => {
    const step = pace.find((s) => km >= s.fromKm && km <= s.toKm) ?? pace[pace.length - 1];
    return step ? yPace(step.value) : 0;
  };

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text role="caption" color="inkTertiary">
          {legend}
        </Text>
        {averageLabel ? (
          <Text role="caption" color="inkTertiary">
            {averageLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.chart} onLayout={onLayout} accessible accessibilityLabel={accessibilityLabel} testID="pace-steps">
        {width > 0 && pace.length > 0 ? (
          <Svg width={width} height={height}>
            {averageSec !== undefined ? (
              <Line
                x1={pad}
                x2={width - pad}
                y1={yPace(averageSec)}
                y2={yPace(averageSec)}
                stroke={colors.inkTertiary}
                strokeWidth={chart.strokeThin}
                strokeDasharray={chart.dash.join(' ')}
              />
            ) : null}
            {target ? (
              <>
                <Line
                  x1={pad}
                  x2={width - pad}
                  y1={yPace(target.valueSec)}
                  y2={yPace(target.valueSec)}
                  stroke={colors.coach}
                  strokeWidth={chart.strokeThin}
                  strokeDasharray={chart.dash.join(' ')}
                />
                <SvgText
                  x={width - pad}
                  y={yPace(target.valueSec) - chart.stroke * 2}
                  fill={colors.coach}
                  fontSize={typography.caption.fontSize}
                  fontFamily={fontFamily.text.semibold}
                  textAnchor="end">
                  {target.label}
                </SvgText>
              </>
            ) : null}
            {hr && hr.length > 0 ? (
              <Path
                d={stepPath(hr, x, yHr)}
                stroke={colors.ink}
                strokeWidth={chart.stroke}
                strokeDasharray={chart.dot.join(' ')}
                fill="none"
              />
            ) : null}
            <Path d={stepPath(pace, x, yPace)} stroke={colors.ink} strokeWidth={chart.stroke} fill="none" />
            {markers.map((m) => (
              <G key={m.label}>
                <Circle cx={x(m.km)} cy={markerY(m.km)} r={size.icon / 2 - chart.stroke} fill={colors.coach} />
                <SvgText
                  x={x(m.km)}
                  y={markerY(m.km) + typography.caption.fontSize / 3}
                  fill={colors.onCoach}
                  fontSize={typography.caption.fontSize}
                  fontFamily={fontFamily.text.semibold}
                  textAnchor="middle">
                  {m.label}
                </SvgText>
              </G>
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={styles.axis}>
        {axis.map((a) => (
          <Text key={a} role="caption" color="inkTertiary">
            {a}
          </Text>
        ))}
      </View>
    </View>
  );
}
