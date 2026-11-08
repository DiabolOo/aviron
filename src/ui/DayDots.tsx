import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type DayDotState = 'empty' | 'done' | 'today';

export type DayDot = {
  id: string;
  /** « L », « Lun ». Absent : cercle seul (progression d'`EmptyState`). */
  label?: string;
  /** « 26 » : sept jours avec dates (`109`). */
  date?: string;
  state: DayDotState;
  accessibilityLabel?: string;
};

export type DayDotsProps = {
  days: readonly DayDot[];
  /** Cercles serrés à gauche, sans répartition sur la largeur. */
  compact?: boolean;
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  compact: { flexDirection: 'row', gap: t.space.sm },
  day: { flex: 1, alignItems: 'center', gap: t.space.xs },
  dot: {
    width: t.size.dayDot,
    height: t.size.dayDot,
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
    marginBottom: t.space.xs,
  },
  done: { backgroundColor: t.colors.ink, borderColor: t.colors.ink },
  today: { borderWidth: t.size.outlineStrong, borderColor: t.colors.ink },
}));

const STATE_WORD: Record<DayDotState, string | null> = { done: 'fait', today: 'aujourd’hui', empty: null };

/** Une rangée de cercles par jour : vide = rien, plein = fait, contour encre = aujourd'hui. */
export function DayDots({ days, compact }: DayDotsProps) {
  const styles = useStyles();
  return (
    <View style={compact ? styles.compact : styles.row}>
      {days.map((d) => {
        const strong = d.state !== 'empty';
        const a11y =
          d.accessibilityLabel ??
          ([[d.label, d.date].filter(Boolean).join(' '), STATE_WORD[d.state]].filter(Boolean).join(', ') || undefined);
        return (
          <View key={d.id} style={compact ? undefined : styles.day} accessible accessibilityLabel={a11y} testID={`day-dot-${d.state}`}>
            <View style={[styles.dot, compact && { marginBottom: 0 }, d.state === 'done' && styles.done, d.state === 'today' && styles.today]} />
            {d.label ? (
              <Text role="sub" weight={strong ? 'semibold' : 'regular'} color={strong ? 'ink' : 'inkTertiary'}>
                {d.label}
              </Text>
            ) : null}
            {d.date ? (
              <Text role="sub" weight="semibold" color={strong ? 'ink' : 'inkSecondary'}>
                {d.date}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
