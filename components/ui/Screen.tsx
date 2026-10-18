import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glow } from '@/components/ui/Glow';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  withSafeBottom?: boolean;
};

export function Screen({ children, scroll = true, withSafeBottom = false }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-10 pt-4"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 px-6 pb-4 pt-4">{children}</View>
  );

  return (
    <View className="flex-1 bg-canvas">
      <Glow />
      <SafeAreaView className="flex-1" edges={withSafeBottom ? ['top', 'bottom'] : ['top']}>
        {content}
      </SafeAreaView>
    </View>
  );
}
