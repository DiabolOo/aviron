import { View } from 'react-native';

import { makeStyles, typography, type TextRole } from '@/src/design';

const useStyles = makeStyles((t) => ({
  line: { backgroundColor: t.colors.surfaceSunken, borderRadius: t.radius.control },
}));

/** Squelette fixe, à la hauteur d'une ligne du rôle donné ; aucune animation. */
export function Skeleton({ role = 'body' }: { role?: TextRole }) {
  const styles = useStyles();
  return (
    <View
      testID="skeleton"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.line, { height: typography[role].lineHeight }]}
    />
  );
}
