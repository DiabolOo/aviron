import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

type IconButtonProps = {
  children: ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'surface' | 'accent' | 'outline';
  disabled?: boolean;
};

const VARIANT = {
  surface: 'bg-chip',
  accent: 'bg-accent',
  outline: 'border border-fg/15',
} as const;

export function IconButton({
  children,
  label,
  onPress,
  variant = 'surface',
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className={`h-11 w-11 items-center justify-center rounded-full active:scale-95 ${VARIANT[variant]} ${disabled ? 'opacity-30' : ''}`}>
      {children}
    </Pressable>
  );
}
