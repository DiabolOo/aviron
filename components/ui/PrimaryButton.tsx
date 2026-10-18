import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
};

const VARIANT = {
  primary: { container: 'bg-accent', text: 'text-accent-fg' },
  ghost: { container: 'bg-fg/5', text: 'text-fg' },
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
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      className={`flex-row items-center justify-center gap-2 rounded-full px-5 py-4 active:opacity-80 ${
        style.container
      } ${disabled ? 'opacity-40' : ''}`}>
      {icon}
      <Text className={`text-base font-semibold ${style.text}`}>{label}</Text>
    </Pressable>
  );
}
