import { type ReactNode } from 'react';

import { Text } from '@/components/ui/Text';

type CaptionProps = {
  children: ReactNode;
  className?: string;
};

export function Caption({ children, className = '' }: CaptionProps) {
  return <Text className={`text-[15px] font-medium text-muted ${className}`}>{children}</Text>;
}

export const Label = Caption;
