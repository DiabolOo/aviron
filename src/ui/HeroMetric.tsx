import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useFontScale, useReduceMotion, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

type Metric = { label: string; value: string; unit?: string };

type Common = {
  /** Valeur finale, formatée en amont (« 1h53:09 », « 3:42 », « 42,5 »). */
  value: string;
  unit?: string;
  /** La phrase sous le chiffre. */
  caption?: string;
  /** 0 à 3 chiffres secondaires ; un chiffre absent n'est pas passé. */
  metrics?: Metric[];
};

export type HeroMetricProps = Common &
  (
    | { /** Temps, allures, records : fondu, une fois au montage. */ animate?: 'fade' }
    | {
        /** Quantités cumulées (durée, km) : compteur 0 → valeur, une fois au montage. */
        animate: 'count';
        countTo: number;
        /** Formate une étape du compteur ; `format(countTo)` doit valoir `value`. */
        format: (n: number) => string;
      }
  );

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.sm },
  line: { flexDirection: 'row', alignItems: 'baseline', gap: t.space.xs },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: t.space.xs },
  hero: { flexShrink: 1 },
  metrics: { flexDirection: 'row', gap: t.space.xl, marginTop: t.space.sm },
  metricsStacked: { gap: t.space.sm, marginTop: t.space.sm },
  metric: { gap: t.space.xs },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: t.space.lg },
}));

/** Compteur JS (une seule fois) : renvoie le texte à afficher. */
function useCount(enabled: boolean, to: number, format: (n: number) => string, final: string): string {
  const { motion } = useTheme();
  const [text, setText] = useState(enabled ? format(0) : final);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / motion.slow);
      if (p >= 1) return setText(final);
      setText(format(to * motion.easing(p)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, to, format, final, motion]);

  return enabled ? text : final;
}

/** Le héros d'un écran (un seul) et ses chiffres secondaires. */
export function HeroMetric(props: HeroMetricProps) {
  const { value, unit, caption, metrics = [] } = props;
  const { motion, heroMinimumFontScale, fontScaleBreakpoints, fontScaleCaps } = useTheme();
  const styles = useStyles();
  const reduce = useReduceMotion();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const counting = props.animate === 'count' && !reduce;
  const shown = useCount(
    counting,
    props.animate === 'count' ? props.countTo : 0,
    props.animate === 'count' ? props.format : String,
    value,
  );

  const opacity = useSharedValue(props.animate === 'count' ? 1 : 0);
  useEffect(() => {
    if (props.animate === 'count') return;
    opacity.set(withTiming(1, { duration: reduce ? motion.fast : motion.base, easing: motion.easing }));
  }, [opacity, props.animate, reduce, motion]);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  const label = [unit ? `${value} ${unit}` : value, caption, ...metrics.map((m) => `${m.label} : ${m.value}${m.unit ? ` ${m.unit}` : ''}`)]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.root} accessible accessibilityLabel={label} testID="hero-metric">
      <Animated.View style={[stacked ? styles.stacked : styles.line, fade]}>
        <Text
          role="hero"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={heroMinimumFontScale}
          style={styles.hero}
          testID="hero-value">
          {shown}
        </Text>
        {unit ? (
          <Text role="verdict" weight="semibold" color="inkSecondary">
            {unit}
          </Text>
        ) : null}
      </Animated.View>
      {caption ? (
        <Text role="sub" color="inkSecondary">
          {caption}
        </Text>
      ) : null}
      {metrics.length > 0 ? (
        <View style={stacked ? styles.metricsStacked : styles.metrics}>
          {metrics.slice(0, 3).map((m) => (
            <View key={m.label} style={stacked ? styles.metricRow : styles.metric}>
              <Text role="caption" color="inkTertiary">
                {m.label}
              </Text>
              <Text role="verdict" weight="semibold" cap={fontScaleCaps.metric}>
                {m.unit ? `${m.value} ${m.unit}` : m.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
