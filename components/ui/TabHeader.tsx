import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { useTheme } from '@/lib/useTheme';

export type TabTint = 'accent' | 'aqua' | 'iris';

type TabHeaderProps = {
  icon: LucideIcon;
  tint: TabTint;
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
};

const BORDER: Record<TabTint, string> = {
  accent: 'border-accent/30',
  aqua: 'border-aqua/30',
  iris: 'border-iris/30',
};

export function TabHeader({ icon: Icon, tint, eyebrow, title, subtitle, right, children }: TabHeaderProps) {
  const { colors } = useTheme();
  const color = tint === 'accent' ? colors.accent : tint === 'aqua' ? colors.aqua : colors.iris;

  return (
    <View className="mt-2">
      <View className="flex-row items-center gap-4">
        <View className={`h-14 w-14 items-center justify-center rounded-full border bg-black ${BORDER[tint]}`}>
          <Icon color={color} size={26} strokeWidth={1.9} />
        </View>
        <View className="flex-1">
          <Label>{eyebrow}</Label>
          <Text className="mt-1 text-3xl font-semibold tracking-tight text-fg">{title}</Text>
          {subtitle ? (
            <Text numberOfLines={1} className="mt-0.5 text-sm text-muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}
