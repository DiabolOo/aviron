import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/Text';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
};

const VARIANT = {
  primary: { container: 'bg-fg', text: 'text-canvas' },
  ghost: { container: 'bg-chip', text: 'text-fg' },
} as const;

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
}: PrimaryButtonProps) {
  const style = VARIANT[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className={`h-[52px] flex-row items-center justify-center gap-2 rounded-full px-6 active:scale-95 ${
        style.container
      } ${disabled ? 'opacity-40' : ''}`}>
      {icon}
      <Text className={`text-[17px] font-semibold ${style.text}`}>{label}</Text>
    </Pressable>
  );
}
