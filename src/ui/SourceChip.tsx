import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

const useStyles = makeStyles((t) => ({
  chip: {
    minHeight: t.size.pill,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.xs,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surfaceSunken,
  },
}));

/** D'où vient la séance : appareil et canal (« COROS, via Strava », « Saisie à la main »), ADR-013. */
export function SourceChip({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.chip} accessible accessibilityLabel={`Source : ${label}`} testID="source-chip">
      <Text role="caption" weight="semibold">
        {label}
      </Text>
    </View>
  );
}
