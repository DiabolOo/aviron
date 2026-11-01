import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RaceDebriefBody } from '@/components/race/RaceDebriefBody';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/src/ui/useTheme';

export default function RaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  return (
    <Screen tone="suivi">
      <View className="flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-fg/5 bg-surface active:opacity-70">
          <ChevronLeft color={colors.fg} size={20} strokeWidth={1.8} />
        </Pressable>
      </View>
      <RaceDebriefBody id={id} />
    </Screen>
  );
}
