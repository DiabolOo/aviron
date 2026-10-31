import { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

type ScreenTitleProps = { title: string; subtitle?: string; right?: ReactNode };

export function ScreenTitle({ title, subtitle, right }: ScreenTitleProps) {
  return (
    <View className="mb-1.5 flex-row items-center justify-between">
      <View className="flex-1 gap-0.5 pr-3">
        <Text
          accessibilityRole="header"
          className="text-[34px] font-bold leading-[38px] tracking-tight text-fg">
          {title}
        </Text>
        {subtitle ? <Text className="text-[16px] text-muted">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
