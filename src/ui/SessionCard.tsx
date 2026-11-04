import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { makeStyles, useFontScale, useReduceMotion, useTheme } from '@/src/design';
import { EffortPill, type EffortPillProps } from '@/src/ui/EffortPill';
import { Text } from '@/src/ui/Text';
import { useHoldToConfirm } from '@/src/ui/useHoldToConfirm';

export type SessionStatus = 'planned' | 'done' | 'postponed';

export type SessionCardProps = {
  /** « Séance du jour », « Ta première séance ». */
  eyebrow: string;
  title: string;
  effort: EffortPillProps;
  /** Consigne déjà adaptée au niveau et aux données disponibles. */
  instruction: string;
  /** Ligne de repère facultative. */
  note?: string;
  status: SessionStatus;
  onValidate: () => void;
  onPostpone: () => void;
  onUndo: () => void;
};

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: t.space.md },
  headStacked: { gap: t.space.sm },
  title: { flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  track: {
    height: t.size.track,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceSunken,
    overflow: 'hidden',
  },
  fill: { height: t.size.track, width: '100%', backgroundColor: t.colors.ink, transformOrigin: 'left' },
  done: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  check: {
    width: t.size.avatar,
    height: t.size.avatar,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.effortEasySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1, gap: t.space.xs },
}));

/** La séance du jour : valider par maintien, reporter, annuler. */
export function SessionCard(props: SessionCardProps) {
  const { eyebrow, title, effort, instruction, note, status, onValidate, onPostpone, onUndo } = props;
  const { colors, motion, space, size, fontScaleBreakpoints } = useTheme();
  const styles = useStyles();
  const reduce = useReduceMotion();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const progress = useSharedValue(0);
  const checkScale = useSharedValue(1);

  const { pressIn, pressOut } = useHoldToConfirm({
    duration: motion.hold,
    onStart: () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!reduce) progress.set(withTiming(1, { duration: motion.hold, easing: motion.easing }));
    },
    onCancel: () => progress.set(reduce ? 0 : withTiming(0, { duration: motion.fast, easing: motion.easing })),
    onComplete: () => {
      progress.set(1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onValidate();
    },
  });

  useEffect(() => {
    if (status !== 'done') return progress.set(0);
    checkScale.set(0);
    checkScale.set(reduce ? 1 : withSpring(1, motion.spring));
  }, [status, reduce, motion, checkScale, progress]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.get() }] }));

  if (status === 'done' || status === 'postponed') {
    const done = status === 'done';
    return (
      <View style={styles.card} testID={`session-card-${status}`}>
        <View style={styles.done}>
          {done ? (
            <Animated.View style={[styles.check, checkStyle]}>
              <Check color={colors.effortEasy} size={size.icon} strokeWidth={size.iconStrokeStrong} />
            </Animated.View>
          ) : null}
          <View style={styles.grow}>
            <Text role="body" weight="semibold">
              {done ? 'Séance validée' : 'Reportée à demain'}
            </Text>
            <Text role="sub" color="inkSecondary">
              {title}
            </Text>
          </View>
          {done ? null : (
            <Pressable accessibilityRole="button" onPress={onUndo} style={styles.link}>
              <Text role="sub" weight="semibold" style={styles.underline}>
                Annuler
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      testID="session-card-planned"
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow}, ${title}. ${instruction}`}
      accessibilityHint="Maintiens pour valider"
      accessibilityActions={[{ name: 'activate', label: 'Valider' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate') onValidate();
      }}
      style={styles.card}>
      <Text role="caption" weight="semibold" color="inkTertiary">
        {eyebrow}
      </Text>
      <View style={stacked ? styles.headStacked : styles.head}>
        <Text role="title" style={styles.title}>
          {title}
        </Text>
        <EffortPill {...effort} />
      </View>
      <Text role="body" color="inkSecondary">
        {instruction}
      </Text>
      {note ? (
        <Text role="sub" color="inkTertiary">
          {note}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text role="caption" color="inkTertiary">
          Maintiens la carte pour valider
        </Text>
        <Pressable accessibilityRole="button" onPress={onPostpone} style={styles.link} hitSlop={space.sm}>
          <Text role="sub" weight="semibold" style={styles.underline}>
            Reporter
          </Text>
        </Pressable>
      </View>
      <View style={styles.track} testID="hold-track">
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </Pressable>
  );
}
