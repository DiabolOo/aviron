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
  primary: {
    container: 'bg-accent border-black/25',
    text: 'text-accent-fg',
    pressIn: Haptics.ImpactFeedbackStyle.Light,
    press: Haptics.ImpactFeedbackStyle.Heavy,
  },
  ghost: {
    container: 'bg-fg/5 border-fg/10',
    text: 'text-fg',
    pressIn: Haptics.ImpactFeedbackStyle.Soft,
    press: Haptics.ImpactFeedbackStyle.Medium,
  },
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
      onPressIn={() => void Haptics.impactAsync(style.pressIn)}
      onPress={() => {
        void Haptics.impactAsync(style.press);
        onPress();
      }}
      className={`flex-row items-center justify-center gap-2 rounded-full border-b-4 px-5 py-4 active:mb-1 active:translate-y-1 active:border-b-0 ${
        style.container
      } ${disabled ? 'opacity-40' : ''}`}>
      {icon}
      <Text className={`text-base font-semibold ${style.text}`}>{label}</Text>
    </Pressable>
  );
}
