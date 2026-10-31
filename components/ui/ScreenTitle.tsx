import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="mb-1.5 flex-row items-center justify-between">
      <Text
        accessibilityRole="header"
        className="text-[34px] font-bold leading-[38px] tracking-tight text-fg">
        {title}
      </Text>
      {right}
    </View>
  );
}
