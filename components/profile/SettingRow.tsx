import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type SettingRowProps = {
  label: string;
  hint?: string;
  first?: boolean;
  onPress?: () => void;
  children?: ReactNode;
};

export function SettingRow({ label, hint, first = false, onPress, children }: SettingRowProps) {
  const { colors } = useTheme();
  const className = `flex-row items-center py-4 ${first ? '' : 'border-t border-fg/5'}`;

  const content = (
    <>
      <View className="flex-1 pr-3">
        <Text className="text-base text-fg">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
      {onPress ? <ChevronRight color={colors.muted} size={18} strokeWidth={1.8} /> : null}
    </>
  );

  if (!onPress) {
    return <View className={className}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className={`${className} active:opacity-70`}>
      {content}
    </Pressable>
  );
}
