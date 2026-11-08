import { useWindowDimensions, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { analyzeSplits, formatSplitKm, type SplitScale } from '@/src/core/sportFormat';
import type { Split } from '@/src/core/schemas';
import { Text } from '@/src/ui/Text';

const BAR_MIN_SCREEN_WIDTH = 380;

const useStyles = makeStyles((t) => ({
  root: { gap: 0 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingBottom: t.space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingVertical: t.space.md,
    borderTopWidth: t.size.hairline,
    borderTopColor: t.colors.line,
  },
  colKm: { width: 28 },
  colPace: { width: 56 },
  barBg: { flex: 1, height: t.size.track, backgroundColor: t.colors.surfaceSunken, borderRadius: t.radius.pill },
  barFill: { height: '100%', borderRadius: t.radius.pill },
  colElev: { width: 48, alignItems: 'flex-end' },
  colHr: { width: 40, alignItems: 'flex-end' },
  paceWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space.md },
}));

export type SplitsListProps = {
  splits: readonly Split[];
  /** « min/km » (run/walk), « /100 m » (swim). */
  paceUnit?: string;
};

/** Tableau d'allures v3.1 : colonnes à largeurs fixes, barres, arrêts exclus. */
export function SplitsList({ splits, paceUnit = 'min/km' }: SplitsListProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  if (splits.length === 0) return null;

  const showBar = width >= BAR_MIN_SCREEN_WIDTH;
  const hasElev = splits.some((s) => s.elevationGain !== 0);
  const hasHr = splits.some((s) => s.avgHr !== undefined);
  const scale = analyzeSplits(splits as unknown as { km: number; paceSec: number }[]);

  return (
    <View style={styles.root} testID="splits-list">
      <View style={styles.head}>
        <View style={styles.colKm}>
          <Text role="caption" color="inkTertiary">Km</Text>
        </View>
        <View style={styles.paceWrap}>
          <View style={styles.colPace}>
            <Text role="caption" color="inkTertiary" numberOfLines={1} ellipsizeMode="clip">
              Allure ({paceUnit})
            </Text>
          </View>
        </View>
        {hasElev ? (
          <View style={styles.colElev}>
            <Text role="caption" color="inkTertiary">D+</Text>
          </View>
        ) : null}
        {hasHr ? (
          <View style={styles.colHr}>
            <Text role="caption" color="inkTertiary">FC</Text>
          </View>
        ) : null}
      </View>
      {splits.map((split) => {
        const stopped = scale.stops.has(split.km);
        const isFastest = !stopped && split.paceSec === scale.fastest;
        const ratio = barRatio(split.paceSec, scale);
        return (
          <View key={split.km} style={styles.row}>
            <View style={styles.colKm}>
              <Text role="sub" color="inkTertiary">{formatSplitKm(split.km)}</Text>
            </View>
            <View style={styles.paceWrap}>
              <View style={styles.colPace}>
                <Text
                  role="sub"
                  weight={isFastest ? 'semibold' : 'regular'}
                  color={stopped ? 'inkTertiary' : 'ink'}
                  numberOfLines={1}
                  ellipsizeMode="clip">
                  {stopped ? 'arrêt' : split.pace}
                </Text>
              </View>
              {showBar && !stopped ? (
                <View style={styles.barBg}>
                  <View
                    testID="split-bar"
                    style={[
                      styles.barFill,
                      {
                        width: `${30 + ratio * 70}%`,
                        backgroundColor: isFastest ? colors.coach : colors.barNeutral,
                      },
                    ]}
                  />
                </View>
              ) : showBar ? (
                <View style={styles.barBg} />
              ) : null}
            </View>
            {hasElev ? (
              <View style={styles.colElev}>
                <Text role="sub" color="inkTertiary">{`${split.elevationGain} m`}</Text>
              </View>
            ) : null}
            {hasHr ? (
              <View style={styles.colHr}>
                <Text role="sub" color="inkTertiary">
                  {split.avgHr !== undefined ? `${split.avgHr}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function barRatio(paceSec: number, scale: SplitScale): number {
  if (scale.fastest === undefined || scale.slowest === undefined || scale.slowest === scale.fastest) {
    return 1;
  }
  return 1 - (paceSec - scale.fastest) / (scale.slowest - scale.fastest);
}
