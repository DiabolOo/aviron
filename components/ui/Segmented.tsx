import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

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
    <View className={`flex-row rounded-full bg-fg/5 p-1 ${className}`}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(option.id);
            }}
            className={`flex-1 items-center rounded-full py-2.5 ${selected ? 'bg-fg' : ''}`}>
            <Text className={`text-sm ${selected ? 'font-semibold text-canvas' : 'text-muted'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
