import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Text } from '@/components/ui/Text';

type ProfileHeaderProps = {
  title: string;
  backLabel: string;
  backTo: '/' | '/profile';
};

export function ProfileHeader({ title, backLabel, backTo }: ProfileHeaderProps) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Retour : ${backLabel}`}
        hitSlop={8}
        onPress={() => router.navigate(backTo)}
        className="h-11 justify-center self-start active:opacity-60">
        <Text className="text-[16px] font-medium text-muted">‹ {backLabel}</Text>
      </Pressable>
      <ScreenTitle title={title} />
    </View>
  );
}
