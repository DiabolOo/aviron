import { type ReactNode } from 'react';
import { Text } from 'react-native';

type LabelProps = {
  children: ReactNode;
  className?: string;
};

export function Label({ children, className = '' }: LabelProps) {
  return (
    <Text className={`font-mono text-[10px] uppercase tracking-[2px] text-muted ${className}`}>
      {children}
    </Text>
  );
}
