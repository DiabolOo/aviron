import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type SegmentedProps<T extends string> = {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={`h-11 flex-row rounded-full bg-fg/10 p-1 ${className}`}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(option.id);
            }}
            className={`flex-1 items-center justify-center rounded-full ${
              selected ? 'bg-white dark:bg-chip' : ''
            }`}>
            <Text
              className={`text-[16px] ${
                selected ? 'font-semibold text-[#0E1116] dark:text-white' : 'font-medium text-muted'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
