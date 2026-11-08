import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useFontScale, useTheme } from '@/src/design';
import { EffortPill, type EffortPillProps } from '@/src/ui/EffortPill';
import { ListCard } from '@/src/ui/ListCard';
import { Text } from '@/src/ui/Text';

export type DayRowProps = {
  id: string;
  /** « Lun 2 ». */
  day: string;
  /** « Footing 8 km », « Repos ». */
  title: string;
  /** « Aujourd'hui », « Fait · ressenti facile ». */
  sub?: string;
  /** Proposition en attente : « Le coach propose 12 km », en indigo. */
  proposal?: string;
  effort?: EffortPillProps;
  rest?: boolean;
  today?: boolean;
  /** Débutant : cercle coché (fait) ou vide (prévu) à gauche ; absent pour un repos. */
  check?: 'done' | 'open';
  /** Séance faite seulement : une séance prévue ou un repos n'est pas touchable (Q6). */
  onPress?: () => void;
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, paddingHorizontal: t.space.sm },
  rowStacked: { gap: t.space.xs, paddingVertical: t.space.md, paddingHorizontal: t.space.sm },
  today: { backgroundColor: t.colors.surfaceSunken, borderRadius: t.radius.control },
  checkCol: { width: t.size.icon, alignItems: 'center' },
  check: {
    width: t.size.icon,
    height: t.size.icon,
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: t.colors.ink, borderColor: t.colors.ink },
  day: { minWidth: t.size.dayColumn },
  main: { flex: 1, gap: t.space.xs },
}));

function DayRow({ row, withChecks }: { row: DayRowProps; withChecks: boolean }) {
  const styles = useStyles();
  const { colors, size, opacity, fontScaleBreakpoints } = useTheme();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const label = [row.day, row.title, row.sub, row.proposal].filter(Boolean).join(', ');

  const content = (
    <>
      {withChecks ? (
        <View style={styles.checkCol}>
          {row.check ? (
            <View style={[styles.check, row.check === 'done' && styles.checkDone]} testID={`day-check-${row.check}`}>
              {row.check === 'done' ? <Check color={colors.surface} size={size.pillDot * 2} strokeWidth={size.iconStrokeStrong} /> : null}
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.day}>
        <Text role="sub" weight="semibold" color="inkSecondary">
          {row.day}
        </Text>
      </View>
      <View style={styles.main}>
        <Text role="body" weight={row.rest ? 'regular' : 'semibold'} color={row.rest ? 'inkSecondary' : 'ink'}>
          {row.title}
        </Text>
        {row.sub ? (
          <Text role="sub" color="inkSecondary">
            {row.sub}
          </Text>
        ) : null}
        {row.proposal ? (
          <Text role="sub" color="coach">
            {row.proposal}
          </Text>
        ) : null}
      </View>
      {row.effort ? <EffortPill {...row.effort} /> : null}
    </>
  );
  const style = [stacked ? styles.rowStacked : styles.row, row.today && styles.today];

  if (row.onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={row.onPress}
        testID={`day-row-${row.id}`}
        style={({ pressed }) => [...style, pressed && { opacity: opacity.pressed }]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View style={style} accessible accessibilityLabel={label} testID={`day-row-${row.id}`}>
      {content}
    </View>
  );
}

/** Les sept jours d'une semaine : prévu et fait (`104`, `215`). */
export function WeekList({ days }: { days: readonly DayRowProps[] }) {
  const withChecks = days.some((d) => d.check !== undefined);
  return (
    <ListCard testID="week-list">
      {days.map((d) => (
        <DayRow key={d.id} row={d} withChecks={withChecks} />
      ))}
    </ListCard>
  );
}
