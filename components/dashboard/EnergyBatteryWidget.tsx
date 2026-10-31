import { useEffect, useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { MOCK_READINESS_INPUT, computeReadiness } from '@/src/core/readiness';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { CountUp } from '@/src/ui/motion/CountUp';
import { useTheme } from '@/src/ui/useTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ECG = 'M0 30 H40 L48 30 L54 18 L60 30 L68 30 L75 6 L83 40 L90 30 H150';

function Pulse() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const offset = useSharedValue(400);

  useEffect(() => {
    offset.set(
      reduced ? 150 : withRepeat(withTiming(0, { duration: 2100, easing: Easing.linear }), -1),
    );
  }, [offset, reduced]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.get() }));

  return (
    <Svg width="100%" height={48} viewBox="0 0 150 44" preserveAspectRatio="none">
      <Path d={ECG} fill="none" stroke={colors.track} strokeWidth={2} />
      <AnimatedPath
        d={ECG}
        fill="none"
        stroke={colors.aqua}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="90 310"
        animatedProps={props}
      />
    </Svg>
  );
}

export function EnergyBatteryWidget() {
  const [open, setOpen] = useState(false);
  const readiness = computeReadiness(MOCK_READINESS_INPUT);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Forme ${readiness.score}, ${readiness.label}. Pourquoi ?`}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((v) => !v);
      }}
      className="flex-1">
      <Card tint="forme" className="flex-1 p-[18px]">
        <View className="mb-1.5 h-[34px] flex-row items-center justify-between">
          <Text className="text-[17px] font-semibold text-fg">Forme</Text>
          <Text className="text-[15px] text-muted underline">Pourquoi ?</Text>
        </View>
        <CountUp
          value={readiness.score}
          className="text-[40px] font-bold leading-[44px] tracking-tight text-fg"
        />
        <Text className="text-[15px] text-muted">{readiness.label}</Text>
        <View className="mt-3">
          <Pulse />
        </View>
        {open ? (
          <View className="mt-3 gap-1.5 border-t border-fg/10 pt-3">
            {readiness.factors.map((factor) => (
              <Text key={factor.label} className="text-[14px] text-muted">
                {factor.label} · {factor.value} · {Math.round(factor.weight * 100)} %
              </Text>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
