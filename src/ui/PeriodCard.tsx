import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { HeroMetric, type HeroMetricProps } from '@/src/ui/HeroMetric';
import { Text } from '@/src/ui/Text';
import { WeekBars, type Bar } from '@/src/ui/WeekBars';

export type PeriodCardProps = {
  /** « Mai 2026 ». */
  period: string;
  /** Absent : le chevron n'est pas rendu (première ou dernière période). */
  onPrev?: () => void;
  onNext?: () => void;
  hero: HeroMetricProps;
  bars: readonly Bar[];
  barsLabel: string;
  /** « Course 2 h 25 · nage 1 h 18 · muscu 1 h 07 ». */
  breakdown?: string;
  /** « **2 semaines actives sur 4** : celles du 11 et du 18 mai. » */
  regularity?: { lead: string; rest?: string };
};

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  chevrons: { flexDirection: 'row', gap: t.space.xs },
  chevron: { width: t.size.touchMin, height: t.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  separator: { height: t.size.hairline, backgroundColor: t.colors.line },
}));

/** Une période de Progrès : héros, barres par semaine, répartition par sport, régularité (`211`). */
export function PeriodCard({ period, onPrev, onNext, hero, bars, barsLabel, breakdown, regularity }: PeriodCardProps) {
  const styles = useStyles();
  const { colors, size, opacity } = useTheme();
  const chevron = (dir: 'prev' | 'next', onPress?: () => void) => {
    if (!onPress) return null;
    const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dir === 'prev' ? 'Période précédente' : 'Période suivante'}
        onPress={onPress}
        style={({ pressed }) => [styles.chevron, pressed && { opacity: opacity.pressed }]}>
        <Icon color={colors.ink} size={size.icon} strokeWidth={size.iconStroke} />
      </Pressable>
    );
  };

  return (
    <View style={styles.card} testID="period-card">
      <View style={styles.head}>
        <Text role="body" weight="semibold" accessibilityRole="header">
          {period}
        </Text>
        <View style={styles.chevrons}>
          {chevron('prev', onPrev)}
          {chevron('next', onNext)}
        </View>
      </View>
      <HeroMetric {...hero} />
      <WeekBars bars={bars} legend={breakdown} accessibilityLabel={barsLabel} />
      {regularity ? (
        <>
          <View style={styles.separator} />
          <Text role="body" color="inkSecondary">
            <Text role="body" weight="semibold">
              {regularity.lead}
            </Text>
            {regularity.rest ? ` ${regularity.rest}` : null}
          </Text>
        </>
      ) : null}
    </View>
  );
}
