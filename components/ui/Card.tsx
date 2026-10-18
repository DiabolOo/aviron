import { type ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`rounded-3xl border border-fg/5 bg-surface p-5 ${className}`}>
      {children}
    </View>
  );
}
