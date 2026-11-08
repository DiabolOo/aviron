import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type Bar = {
  id: string;
  /** Sous la barre : « L », « 4 mai ». */
  label: string;
  /** Quantité brute (minutes, km) : sert seulement aux proportions. 0 = trait plat. */
  value: number;
  /** Au-dessus de la barre, formaté par core : « 47 min », « 4 h 03 », « — » pour une période vide. */
  valueLabel?: string;
  /** Jour courant ou période la plus forte : en encre. */
  highlight?: boolean;
};

export type WeekBarsProps = {
  bars: readonly Bar[];
  /** Répartition par sport sous le graphique : « Nage lun. et mar. · course mer. et ven. ». */
  legend?: string;
  /** La phrase que le graphique illustre, lue à sa place. */
  accessibilityLabel: string;
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: t.space.sm },
  col: { flex: 1, alignItems: 'stretch', gap: t.space.xs },
  area: { height: t.chart.bars, justifyContent: 'flex-end' },
  bar: { borderRadius: t.chart.barRadius, backgroundColor: t.colors.barNeutral },
  on: { backgroundColor: t.colors.ink },
  flat: { height: t.chart.flat, borderRadius: t.radius.pill, backgroundColor: t.colors.barNeutral },
  center: { textAlign: 'center' },
}));

/** Histogramme : jour courant (ou période forte) en encre, les autres en `barNeutral`, un jour vide en trait plat. */
export function WeekBars({ bars, legend, accessibilityLabel }: WeekBarsProps) {
  const styles = useStyles();
  const max = Math.max(0, ...bars.map((b) => b.value));
  const withValues = bars.some((b) => b.valueLabel !== undefined);

  return (
    <View style={styles.root}>
      <View style={styles.bars} accessible accessibilityLabel={accessibilityLabel} testID="week-bars">
        {bars.map((b) => (
          <View key={b.id} style={styles.col}>
            {withValues ? (
              <Text role="caption" color={b.highlight ? 'ink' : 'inkTertiary'} style={styles.center}>
                {b.valueLabel ?? ' '}
              </Text>
            ) : null}
            <View style={styles.area}>
              {b.value > 0 && max > 0 ? (
                <View testID={`bar-${b.id}`} style={[styles.bar, b.highlight && styles.on, { height: `${(b.value / max) * 100}%` }]} />
              ) : (
                <View testID={`bar-flat-${b.id}`} style={styles.flat} />
              )}
            </View>
            <Text role="caption" weight={b.highlight ? 'semibold' : 'regular'} color={b.highlight ? 'ink' : 'inkTertiary'} style={styles.center}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>
      {legend ? (
        <Text role="sub" color="inkSecondary">
          {legend}
        </Text>
      ) : null}
    </View>
  );
}
