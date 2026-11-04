import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Vrai si VoiceOver ou TalkBack est actif. */
export function useScreenReader(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((v) => alive && setEnabled(v));
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return enabled;
}
