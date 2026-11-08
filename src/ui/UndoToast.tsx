import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useReduceMotion, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';
import { useScreenReader } from '@/src/ui/useScreenReader';

export type UndoToastProps = {
  visible: boolean;
  /** « Séance validée », « Plan modifié ». */
  message: string;
  onUndo: () => void;
  /** Fin du décompte (jamais appelé quand un lecteur d'écran est actif). */
  onDismiss: () => void;
  /** Distance au bas de l'écran (barre d'onglets, zone sûre). */
  bottomInset?: number;
};

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', left: t.space.screen, right: t.space.screen },
  bar: { borderRadius: t.radius.control, backgroundColor: t.colors.ink, overflow: 'hidden' },
  row: {
    minHeight: t.size.touchMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingLeft: t.space.screen,
    paddingRight: t.space.sm,
  },
  track: { height: t.size.track, backgroundColor: t.colors.inkTertiary },
  fill: { height: t.size.track, backgroundColor: t.colors.coach },
  message: { flex: 1 },
  undo: { minHeight: t.size.touchMin, justifyContent: 'center', paddingHorizontal: t.space.md },
  underline: { textDecorationLine: 'underline' },
}));

/** Décompte qu'on peut mettre en pause et reprendre. */
function makeCountdown() {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let remaining = 0;
  let startedAt = 0;
  let done = () => {};
  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const resume = () => {
    stop();
    startedAt = Date.now();
    timer = setTimeout(() => {
      timer = null;
      done();
    }, remaining);
  };
  return {
    start(duration: number, onDone: () => void) {
      remaining = duration;
      done = onDone;
      resume();
    },
    pause() {
      if (!timer) return;
      stop();
      remaining -= Date.now() - startedAt;
    },
    resume() {
      if (!timer && remaining > 0) resume();
    },
    stop() {
      stop();
      remaining = 0;
    },
  };
}

/**
 * Bandeau « Annuler » : visible `motion.undo`, décompte en pause tant qu'on le touche. Avec un
 * lecteur d'écran, il est annoncé et ne disparaît pas seul.
 */
export function UndoToast({ visible, message, onUndo, onDismiss, bottomInset = 0 }: UndoToastProps) {
  const styles = useStyles();
  const { motion, size, space } = useTheme();
  const reduce = useReduceMotion();
  const screenReader = useScreenReader();
  const shift = useSharedValue(1);
  const progress = useSharedValue(1);
  const [countdown] = useState(makeCountdown);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });

  // Après masquage, le bandeau reste monté le temps de glisser hors de l'écran.
  const [prevVisible, setPrevVisible] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setLeaving(!visible);
  }
  const outDuration = reduce ? motion.fast : motion.base;

  useEffect(() => {
    shift.set(withTiming(visible ? 0 : 1, { duration: outDuration, easing: motion.easing }));
  }, [visible, outDuration, motion, shift]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setLeaving(false), outDuration);
    return () => clearTimeout(t);
  }, [leaving, outDuration]);

  useEffect(() => {
    if (!visible) return countdown.stop();
    if (screenReader) {
      AccessibilityInfo.announceForAccessibility(`${message}. Annuler disponible.`);
      return countdown.stop();
    }
    countdown.start(motion.undo, () => dismiss.current());
    return countdown.stop;
  }, [visible, screenReader, message, motion, countdown]);

  // Piste de décompte : suit le décompte réel, en pause au toucher. Fixe sous « réduire les animations ».
  useEffect(() => {
    progress.set(1);
    if (!visible || screenReader || reduce) return;
    progress.set(withTiming(0, { duration: motion.undo, easing: Easing.linear }));
  }, [visible, screenReader, reduce, message, motion, progress]);

  const pause = () => {
    countdown.pause();
    progress.set(progress.get());
  };
  const resume = () => {
    countdown.resume();
    if (!screenReader && !reduce && progress.get() > 0) {
      progress.set(withTiming(0, { duration: progress.get() * motion.undo, easing: Easing.linear }));
    }
  };
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  const slide = useAnimatedStyle(() => ({
    opacity: 1 - shift.get(),
    transform: [{ translateY: shift.get() * (size.touchMin + space.lg) }],
  }));

  if (!visible && !leaving) return null;

  return (
    <Animated.View style={[styles.wrap, { bottom: bottomInset + space.lg }, slide]} pointerEvents="box-none">
      <View
        testID="undo-toast"
        style={styles.bar}
        accessibilityLiveRegion="polite"
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}>
        <View style={styles.row}>
          <Text role="sub" weight="semibold" color="bg" style={styles.message}>
            {message}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Annuler : ${message}`} onPress={onUndo} style={styles.undo}>
            <Text role="sub" weight="semibold" color="bg" style={styles.underline}>
              Annuler
            </Text>
          </Pressable>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}
