import { View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';
import { formatKmRange, formatPaceKm } from '@/src/core/training/raceView';
import type { PaceBand } from '@/src/core/training/engine';
import { NBSP } from '@/src/core/sportFormat';

export type RaceBandsProps = {
  /** « Ta course en quatre quarts ». */
  title: string;
  bands: readonly PaceBand[];
  /** Allure moyenne officielle (s/km) — ligne de référence. */
  averagePaceSec?: number;
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    paddingVertical: t.space.sm,
  },
  range: { width: 72 },
  barWrap: { flex: 1, height: t.size.track, backgroundColor: t.colors.surfaceSunken, borderRadius: t.radius.pill, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: t.radius.pill },
  pace: { width: 48, alignItems: 'flex-end' },
}));

/** « Ta course en quatre quarts » : barres proportionnelles. */
export function RaceBands({ title, bands, averagePaceSec }: RaceBandsProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  if (bands.length === 0) return null;

  // Trouver le plus rapide et le plus lent pour scaler les barres.
  const paces = bands.map((b) => b.officialPaceSec).filter((p): p is number => p !== undefined);
  if (paces.length === 0) return null;
  const fastest = Math.min(...paces);
  const slowest = Math.max(...paces);
  const bestBand = bands.find((b) => b.officialPaceSec === fastest);

  return (
    <View style={styles.root} testID="race-bands">
      <View style={styles.header}>
        <Text role="body" weight="semibold">{title}</Text>
        <Text role="caption" color="inkTertiary">{`plus long${NBSP}=${NBSP}plus vite`}</Text>
      </View>
      {bands.map((band) => {
        const pace = band.officialPaceSec;
        if (pace === undefined) return null;
        const ratio = slowest === fastest ? 1 : 1 - (pace - fastest) / (slowest - fastest);
        const widthPct = 30 + ratio * 70;
        const isBest = band === bestBand;
        return (
          <View key={band.label} style={styles.row}>
            <View style={styles.range}>
              <Text role="sub" color="inkTertiary">{formatKmRange(band.fromKm, band.toKm)}</Text>
            </View>
            <View style={styles.barWrap}>
              <View
                testID="race-band-bar"
                style={[
                  styles.bar,
                  {
                    width: `${widthPct}%`,
                    backgroundColor: isBest ? colors.coach : colors.barNeutral,
                  },
                ]}
              />
            </View>
            <View style={styles.pace}>
              <Text role="sub" weight={isBest ? 'semibold' : 'regular'}>
                {formatPaceKm(pace)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
