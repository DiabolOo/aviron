import { type ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

export function Card({ children, className = '', elevated = false }: CardProps) {
  return (
    <View
      className={`rounded-3xl border border-fg/10 bg-surface p-5 ${
        elevated ? 'shadow-sm' : ''
      } ${className}`}>
      {children}
    </View>
  );
}
