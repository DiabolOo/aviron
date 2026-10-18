import { type ReactNode } from 'react';
import { Text } from 'react-native';

type LabelProps = {
  children: ReactNode;
  className?: string;
};

export function Label({ children, className = '' }: LabelProps) {
  return (
    <Text className={`font-mono text-xs font-medium uppercase tracking-[2px] text-fg/70 ${className}`}>
      {children}
    </Text>
  );
}
