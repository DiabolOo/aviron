import { type ReactNode } from 'react';
import { View } from 'react-native';

import { CardHalo, type CardTint } from '@/components/ui/CardHalo';
import { useTheme } from '@/src/ui/useTheme';

type CardProps = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  tint?: CardTint;
};

export function Card({ children, className = '', tint }: CardProps) {
  const { scheme, colors } = useTheme();
  const dark = scheme === 'dark';

  return (
    <View
      className={`rounded-3xl p-5 ${className}`}
      style={{
        backgroundColor: colors.cardBg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        shadowColor: dark ? '#000' : '#0E1116',
        shadowOpacity: dark ? 0.55 : 0.09,
        shadowRadius: dark ? 16 : 15,
        shadowOffset: { width: 0, height: dark ? 8 : 6 },
        elevation: dark ? 6 : 3,
      }}>
      {tint ? <CardHalo tint={tint} /> : null}
      {children}
    </View>
  );
}
