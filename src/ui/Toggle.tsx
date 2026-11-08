import { Switch } from 'react-native';

import { useTheme } from '@/src/design';

export type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Lu par le lecteur d'écran : le libellé de la ligne. */
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
};

/** Bascule des réglages et de l'accord : piste encre quand elle est active (`210`, `213`). */
export function Toggle({ value, onChange, accessibilityLabel, disabled, testID }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <Switch
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: colors.line, true: colors.buttonPrimary }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.line}
    />
  );
}
