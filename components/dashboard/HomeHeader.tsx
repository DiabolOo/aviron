import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { greetingForHour } from '@/lib/dates';

type HomeHeaderProps = {
  firstName: string;
};

export function HomeHeader({ firstName }: HomeHeaderProps) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View className="mt-2 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Label>{dateLabel}</Label>
        <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">
          {greetingForHour(now.getHours())}, {firstName}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le profil"
        onPress={() => router.navigate('/profil')}
        className="h-11 w-11 items-center justify-center rounded-full bg-fg active:opacity-70">
        <Text className="text-base font-semibold text-canvas">
          {firstName.charAt(0).toUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
}
