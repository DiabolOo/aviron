import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

export function ScanButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scanner une assiette"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/scan');
      }}
      className="mt-8 flex-row items-center gap-4 rounded-4xl bg-accent p-5 active:opacity-85">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-fg">
        <ScanLine color={colors.accent} size={24} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold text-accent-fg">Scanner une assiette</Text>
        <Text className="mt-0.5 text-sm text-accent-fg/60">Calories et macros en une photo</Text>
      </View>
    </Pressable>
  );
}
