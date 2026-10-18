import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

type SettingRowProps = {
  label: string;
  hint?: string;
  first?: boolean;
  children: ReactNode;
};

export function SettingRow({ label, hint, first = false, children }: SettingRowProps) {
  return (
    <View className={`flex-row items-center py-4 ${first ? '' : 'border-t border-fg/5'}`}>
      <View className="flex-1 pr-3">
        <Text className="text-base text-fg">{label}</Text>
        {hint ? <Text className="mt-0.5 text-sm text-muted">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
