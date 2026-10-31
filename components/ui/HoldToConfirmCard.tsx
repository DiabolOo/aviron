import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import type { CardTint } from '@/components/ui/CardHalo';
import { Text } from '@/components/ui/Text';
import {
  HOLD_DURATION_MS,
  HOLD_RELEASE_MS,
  UNDO_WINDOW_MS,
  roundedRectPerimeter,
} from '@/src/core/hold';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useTheme } from '@/src/ui/useTheme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const RADIUS = 28;

type HoldToConfirmCardProps = {
  children: ReactNode;
  done: boolean;
  onConfirm: () => void;
  onUndo?: () => void;
  label: string;
  doneTitle: string;
  doneSubtitle?: string;
  tint?: CardTint;
  color?: string;
  className?: string;
};

export function HoldToConfirmCard({
  children,
  done,
  onConfirm,
  onUndo,
  label,
  doneTitle,
  doneSubtitle,
  tint = 'sport',
  color,
  className = '',
}: HoldToConfirmCardProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const stroke = color ?? colors.sport;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [undoExpired, setUndoExpired] = useState(false);
  const undoVisible = done && !undoExpired;
  const progress = useSharedValue(0);
  const pop = useSharedValue(done ? 1 : 0);
  const perimeter = roundedRectPerimeter(size.w, size.h, RADIUS);

  useEffect(() => {
    if (!done) {
      pop.set(0);
      progress.set(0);
      return;
    }
    pop.set(withSequence(withSpring(1.06, { damping: 8, stiffness: 160 }), withSpring(1)));
    if (!onUndo) return;
    const id = setTimeout(() => setUndoExpired(true), UNDO_WINDOW_MS);
    return () => {
      clearTimeout(id);
      setUndoExpired(false);
    };
  }, [done, onUndo, pop, progress]);

  const confirm = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const start = () => {
    if (done) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.set(
      withTiming(1, { duration: HOLD_DURATION_MS, easing: Easing.linear }, (finished) => {
        if (finished) runOnJS(confirm)();
      }),
    );
  };

  const release = () => {
    if (done) return;
    cancelAnimation(progress);
    progress.set(withTiming(0, { duration: HOLD_RELEASE_MS, easing: Easing.out(Easing.quad) }));
  };

  const perimProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.get()),
  }));
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - progress.get() * 0.015 }],
  }));
  const doneStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.get() * 2),
    transform: [{ scale: 0.92 + 0.08 * pop.get() }],
  }));

  return (
    <Animated.View style={scaleStyle} className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Maintiens le doigt appuyé pour valider"
        accessibilityActions={[{ name: 'activate', label }]}
        onAccessibilityAction={() => !done && confirm()}
        onPressIn={reduced ? undefined : start}
        onPressOut={reduced ? undefined : release}
        onPress={reduced && !done ? confirm : undefined}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <Card tint={tint} className="gap-4 p-5">
          {children}
          {size.w > 0 ? (
            <Svg
              pointerEvents="none"
              width={size.w}
              height={size.h}
              style={{ position: 'absolute', top: -1, left: -1 }}>
              <AnimatedRect
                x={2}
                y={2}
                width={size.w - 4}
                height={size.h - 4}
                rx={RADIUS}
                ry={RADIUS}
                fill="none"
                stroke={stroke}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray={`${perimeter} ${perimeter}`}
                animatedProps={perimProps}
              />
            </Svg>
          ) : null}
          {done ? (
            <Animated.View
              pointerEvents="box-none"
              className="absolute inset-0 items-center justify-center gap-2 rounded-3xl"
              style={[{ backgroundColor: colors.done }, doneStyle]}>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Check color="#FFFFFF" size={34} strokeWidth={2.6} />
              </View>
              <Text className="text-[21px] font-bold text-white">{doneTitle}</Text>
              {doneSubtitle ? <Text className="text-[15px] text-white/85">{doneSubtitle}</Text> : null}
              {undoVisible && onUndo ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                  onPress={onUndo}
                  className="absolute bottom-3 right-4 h-11 justify-center px-3 active:opacity-70">
                  <Text className="text-[15px] font-semibold text-white underline">Annuler</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ) : null}
        </Card>
      </Pressable>
    </Animated.View>
  );
}
