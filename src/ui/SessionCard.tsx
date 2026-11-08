import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { makeStyles, useFontScale, useReduceMotion, useTheme } from '@/src/design';
import { ChoiceChips } from '@/src/ui/ChoiceChips';
import { EFFORT_LABEL, EffortPill, type EffortLevel, type EffortPillProps } from '@/src/ui/EffortPill';
import { Text } from '@/src/ui/Text';
import { useHoldToConfirm } from '@/src/ui/useHoldToConfirm';

export type SessionStatus = 'planned' | 'done' | 'autoValidated' | 'postponed' | 'rest';

export type SessionCardProps = {
  /** « Séance du jour », « Ta première séance ». */
  eyebrow: string;
  /** « Footing 8 km », « 20 minutes, marche et course », « Repos ». */
  title: string;
  effort: EffortPillProps;
  /** Consigne déjà adaptée au niveau et aux données ; pour un repos, ce que le repos prépare. */
  instruction: string;
  /** Ligne de repère facultative. */
  note?: string;
  status: SessionStatus;
  /** Libellés de core selon le niveau déclaré (`sessionCardLabels`). */
  holdHint?: string;
  postponeLabel?: string;
  /** Ressenti déclaré après le maintien (« Facile · Correct · Dur ») : la seule mesure d'une séance sans montre. */
  felt?: EffortLevel;
  /** Présent : la carte validée demande le ressenti. */
  onFeel?: (level: EffortLevel) => void;
  onValidate: () => void;
  onPostpone: () => void;
  onUndo: () => void;
};

const FELT_CHOICES = (['easy', 'moderate', 'hard'] as const).map((level) => ({
  id: level,
  label: EFFORT_LABEL.felt[level],
  effort: level,
}));

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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  eyebrow: { flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  hint: { flexShrink: 1 },
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

/** La séance du jour : valider par maintien, donner son ressenti, reporter, annuler. */
export function SessionCard(props: SessionCardProps) {
  const { eyebrow, title, effort, instruction, note, status, onValidate, onPostpone, onUndo } = props;
  const holdHint = props.holdHint ?? 'Maintiens la carte pour valider';
  const postponeLabel = props.postponeLabel ?? 'Reporter';
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

  const header = (
    <View style={stacked ? undefined : styles.head}>
      <Text role="caption" weight="semibold" color="inkTertiary" style={styles.eyebrow}>
        {eyebrow}
      </Text>
      {stacked ? null : <EffortPill {...effort} />}
    </View>
  );
  const body = (
    <>
      <Text role="title">{title}</Text>
      {stacked ? <EffortPill {...effort} /> : null}
      <Text role="body" color="inkSecondary">
        {instruction}
      </Text>
      {note ? (
        <Text role="sub" color="inkTertiary">
          {note}
        </Text>
      ) : null}
    </>
  );

  if (status === 'rest') {
    return (
      <View style={styles.card} testID="session-card-rest" accessible accessibilityLabel={`${eyebrow}, ${title}. ${instruction}`}>
        {header}
        {body}
      </View>
    );
  }

  if (status !== 'planned') {
    const validated = status === 'done' || status === 'autoValidated';
    const heading = status === 'done' ? 'Séance validée' : status === 'autoValidated' ? 'Validée par ta montre' : 'Reportée à demain';
    return (
      <View style={styles.card} testID={`session-card-${status}`}>
        <View style={styles.done}>
          {validated ? (
            <Animated.View style={[styles.check, checkStyle]}>
              <Check color={colors.effortEasy} size={size.icon} strokeWidth={size.iconStrokeStrong} />
            </Animated.View>
          ) : null}
          <View style={styles.grow}>
            <Text role="body" weight="semibold">
              {heading}
            </Text>
            <Text role="sub" color="inkSecondary">
              {title}
            </Text>
          </View>
          {status === 'done' ? null : (
            <Pressable accessibilityRole="button" onPress={onUndo} style={styles.link}>
              <Text role="sub" weight="semibold" style={styles.underline}>
                Annuler
              </Text>
            </Pressable>
          )}
        </View>
        {status === 'done' && props.onFeel ? (
          <>
            <Text role="body" weight="semibold">
              Comment tu l’as sentie ?
            </Text>
            <ChoiceChips
              choices={FELT_CHOICES}
              selected={props.felt}
              onChoose={(id) => props.onFeel?.(id as EffortLevel)}
              columns={FELT_CHOICES.length}
              accessibilityLabel="Ton ressenti"
            />
          </>
        ) : null}
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
      accessibilityHint={holdHint}
      accessibilityActions={[{ name: 'activate', label: 'Valider' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate') onValidate();
      }}
      style={styles.card}>
      {header}
      {body}
      <View style={styles.track} testID="hold-track">
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <View style={styles.footer}>
        <Text role="caption" color="inkTertiary" style={styles.hint}>
          {holdHint}
        </Text>
        <Pressable accessibilityRole="button" onPress={onPostpone} style={styles.link} hitSlop={space.sm}>
          <Text role="sub" weight="semibold" style={styles.underline}>
            {postponeLabel}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
