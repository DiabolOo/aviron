import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';
import { Toggle } from '@/src/ui/Toggle';

export type ConsentBlockProps = {
  /** « allures, durées, FC moyennes, par semaine. » */
  sends: string;
  /** « ton nom, ta position, tes activités Strava. » */
  never: string;
  accepted: boolean;
  onChange: (accepted: boolean) => void;
  acceptLabel?: string;
};

const useStyles = makeStyles((t) => ({
  block: { backgroundColor: t.colors.surfaceSunken, borderRadius: t.radius.control, padding: t.space.lg, gap: t.space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md, minHeight: t.size.touchMin },
  label: { flexShrink: 1 },
}));

/** Ce qui part vers l'IA, ce qui ne part jamais, et l'accord explicite (`210` étape 4). */
export function ConsentBlock({ sends, never, accepted, onChange, acceptLabel = 'J’accepte cet envoi' }: ConsentBlockProps) {
  const styles = useStyles();
  return (
    <View style={styles.block} testID="consent-block">
      <Text role="sub" color="inkSecondary">
        <Text role="sub" weight="semibold">
          Ce qui part :
        </Text>
        {` ${sends} `}
        <Text role="sub" weight="semibold">
          Jamais :
        </Text>
        {` ${never}`}
      </Text>
      <View style={styles.row}>
        <Text role="sub" weight="semibold" style={styles.label}>
          {acceptLabel}
        </Text>
        <Toggle value={accepted} onChange={onChange} accessibilityLabel={acceptLabel} testID="consent-toggle" />
      </View>
    </View>
  );
}
