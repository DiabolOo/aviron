import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/lib/useTheme';

type EmptyStateAction = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'ghost';
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className = '',
  children,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const hasActions = Boolean(action) || Boolean(children);
  const actions = hasActions ? (
    <View className={`w-full gap-2.5 ${compact ? 'mt-3' : 'mt-5'}`}>
      {action ? (
        <PrimaryButton
          variant={action.variant ?? 'ghost'}
          label={action.label}
          icon={action.icon}
          onPress={action.onPress}
        />
      ) : null}
      {children}
    </View>
  ) : null;

  if (compact) {
    return (
      <View className={`rounded-3xl border border-dashed border-fg/15 p-4 ${className}`}>
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-fg/5">
            <Icon color={colors.muted} size={16} strokeWidth={1.8} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-fg">{title}</Text>
            {description ? <Text className="mt-0.5 text-xs text-muted">{description}</Text> : null}
          </View>
        </View>
        {actions}
      </View>
    );
  }

  return (
    <View
      className={`items-center rounded-3xl border border-fg/5 bg-surface px-6 py-10 ${className}`}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-fg/5">
        <Icon color={colors.muted} size={20} strokeWidth={1.8} />
      </View>
      <Text className="mt-4 text-base font-semibold text-fg">{title}</Text>
      {description ? (
        <Text className="mt-1 text-center text-sm text-muted">{description}</Text>
      ) : null}
      {actions}
    </View>
  );
}
