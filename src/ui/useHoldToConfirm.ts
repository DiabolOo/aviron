import { useCallback, useEffect, useRef } from 'react';

type Options = {
  /** Durée du maintien (motion.hold). */
  duration: number;
  onStart?: () => void;
  onCancel?: () => void;
  onComplete: () => void;
};

/**
 * Validation par maintien : `pressIn` arme un minuteur de `duration` ; `pressOut` avant la fin
 * annule. Le geste ne dépend pas des animations : « réduire les animations » ne le raccourcit pas.
 */
export function useHoldToConfirm({ duration, onStart, onCancel, onComplete }: Options) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacks = useRef({ onStart, onCancel, onComplete });
  useEffect(() => {
    callbacks.current = { onStart, onCancel, onComplete };
  });

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const pressIn = useCallback(() => {
    clear();
    callbacks.current.onStart?.();
    timer.current = setTimeout(() => {
      timer.current = null;
      callbacks.current.onComplete();
    }, duration);
  }, [duration]);

  const pressOut = useCallback(() => {
    if (!timer.current) return;
    clear();
    callbacks.current.onCancel?.();
  }, []);

  useEffect(() => clear, []);

  return { pressIn, pressOut };
}
