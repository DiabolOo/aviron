import * as Haptics from 'expo-haptics';
import { Switch } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type ConnectionSwitchProps = {
  value: boolean;
  label: string;
  onToggle: () => void;
};

export function ConnectionSwitch({ value, label, onToggle }: ConnectionSwitchProps) {
  const { colors } = useTheme();

  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={() => {
        void Haptics.selectionAsync();
        onToggle();
      }}
      trackColor={{ false: colors.track, true: colors.accent }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.track}
    />
  );
}
