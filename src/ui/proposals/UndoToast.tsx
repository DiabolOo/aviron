import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProposalStore } from '@/lib/proposalStore';

const TOAST_DURATION_MS = 5000;

export function UndoToast() {
  const insets = useSafeAreaInsets();
  const lastResolved = useProposalStore((s) => s.lastResolved);
  const undo = useProposalStore((s) => s.undo);
  const dismissToast = useProposalStore((s) => s.dismissToast);

  useEffect(() => {
    if (!lastResolved) return;
    const timer = setTimeout(dismissToast, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [lastResolved, dismissToast]);

  if (!lastResolved) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-5"
      style={{ bottom: insets.bottom + 88 }}>
      <View className="flex-row items-center justify-center gap-2 self-center rounded-full bg-fg px-5 py-3 shadow-lg">
        <Text className="text-sm text-canvas" numberOfLines={1}>
          {lastResolved.label}
        </Text>
        <Text className="text-sm text-canvas/50">·</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          onPress={() => void undo(lastResolved.id)}
          className="active:opacity-70">
          <Text className="text-sm font-semibold text-accent">Annuler</Text>
        </Pressable>
      </View>
    </View>
  );
}
