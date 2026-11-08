import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useFontScale, useTheme } from '@/src/design';
import { ListCard } from '@/src/ui/ListCard';
import { Text } from '@/src/ui/Text';
import { Toggle } from '@/src/ui/Toggle';

export type SettingsRow = {
  id: string;
  label: string;
  /** À droite : « Je m'entraîne », « Apparence, modules ». */
  value?: string;
  /** Sous le libellé : « Sur ton téléphone », ou une alerte « Aucune FC reçue depuis juin. C'est voulu ? ». */
  sub?: string;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  /** Ligne touchable avec chevron. */
  onPress?: () => void;
};

const useStyles = makeStyles((t) => ({
  group: { gap: t.space.sm },
  title: { paddingHorizontal: t.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: t.size.touchMin, paddingVertical: t.space.md },
  rowStacked: { gap: t.space.xs, paddingVertical: t.space.md },
  main: { flex: 1, gap: t.space.xs },
  side: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs, flexShrink: 1 },
  value: { flexShrink: 1, textAlign: 'right' },
}));

function Row({ row }: { row: SettingsRow }) {
  const styles = useStyles();
  const { colors, size, opacity, fontScaleBreakpoints } = useTheme();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const content = (
    <>
      <View style={styles.main}>
        <Text role="sub" weight="semibold">
          {row.label}
        </Text>
        {row.sub ? (
          <Text role="caption" color="inkSecondary">
            {row.sub}
          </Text>
        ) : null}
      </View>
      {row.value || row.onPress ? (
        <View style={styles.side}>
          {row.value ? (
            <Text role="sub" color="inkSecondary" style={stacked ? undefined : styles.value}>
              {row.value}
            </Text>
          ) : null}
          {row.onPress ? <ChevronRight color={colors.inkSecondary} size={size.pillDot * 2} strokeWidth={size.iconStroke} /> : null}
        </View>
      ) : null}
      {row.toggle ? <Toggle value={row.toggle.value} onChange={row.toggle.onChange} accessibilityLabel={row.label} testID={`toggle-${row.id}`} /> : null}
    </>
  );
  const style = stacked && !row.toggle ? styles.rowStacked : styles.row;
  if (row.onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[row.label, row.value, row.sub].filter(Boolean).join(', ')}
        onPress={row.onPress}
        testID={`settings-${row.id}`}
        style={({ pressed }) => [style, pressed && { opacity: opacity.pressed }]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View style={style} testID={`settings-${row.id}`}>
      {content}
    </View>
  );
}

/** Une section du profil : titre en légende et carte de lignes (`213`). */
export function SettingsGroup({ title, rows }: { title?: string; rows: readonly SettingsRow[] }) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      {title ? (
        <Text role="caption" weight="semibold" color="inkSecondary" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <ListCard>
        {rows.map((r) => (
          <Row key={r.id} row={r} />
        ))}
      </ListCard>
    </View>
  );
}
