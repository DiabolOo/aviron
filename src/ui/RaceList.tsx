import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { ListCard } from '@/src/ui/ListCard';
import { Text } from '@/src/ui/Text';

export type RaceRow = {
  id: string;
  /** « 11 oct. 2026 · Reims ». */
  title: string;
  /** « 5:22 /km · sans cardio ». */
  sub?: string;
  /** « 1h53:09 ». */
  time: string;
  /** Écart au record : « +4:53 ». Absent pour le record lui-même. */
  gap?: string;
  record?: boolean;
  /** Ouvre le débrief de la course. */
  onPress?: () => void;
};

export type RaceListProps = {
  /** « Tes semis ». */
  title: string;
  /** « écart à ton record ». */
  caption?: string;
  races: readonly RaceRow[];
  recordLabel?: string;
};

const useStyles = makeStyles((t) => ({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: t.space.md, paddingVertical: t.space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md, paddingVertical: t.space.md },
  left: { flex: 1, gap: t.space.xs },
  right: { alignItems: 'flex-end', gap: t.space.xs },
  record: {
    minHeight: t.size.pill,
    justifyContent: 'center',
    paddingHorizontal: t.space.md,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.buttonPrimary,
  },
}));

function Row({ race, recordLabel }: { race: RaceRow; recordLabel: string }) {
  const styles = useStyles();
  const { opacity } = useTheme();
  const label = [race.title, race.sub, race.time, race.record ? recordLabel : race.gap].filter(Boolean).join(', ');
  const content = (
    <>
      <View style={styles.left}>
        <Text role="sub" weight="semibold">
          {race.title}
        </Text>
        {race.sub ? (
          <Text role="caption" color="inkSecondary">
            {race.sub}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text role="verdict" weight="semibold">
          {race.time}
        </Text>
        {race.record ? (
          <View style={styles.record} testID="race-record">
            <Text role="caption" weight="semibold" color="onButtonPrimary">
              {recordLabel}
            </Text>
          </View>
        ) : race.gap ? (
          <Text role="caption" color="inkSecondary">
            {race.gap}
          </Text>
        ) : null}
      </View>
    </>
  );
  return race.onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={race.onPress}
      testID={`race-${race.id}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: opacity.pressed }]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row} accessible accessibilityLabel={label} testID={`race-${race.id}`}>
      {content}
    </View>
  );
}

/** « Tes semis » : chaque course, son temps et l'écart à ton record (`211`). */
export function RaceList({ title, caption, races, recordLabel = 'Record' }: RaceListProps) {
  const styles = useStyles();
  return (
    <ListCard
      testID="race-list"
      header={
        <View style={styles.head}>
          <Text role="body" weight="semibold" accessibilityRole="header">
            {title}
          </Text>
          {caption ? (
            <Text role="caption" color="inkTertiary">
              {caption}
            </Text>
          ) : null}
        </View>
      }>
      {races.map((r) => (
        <Row key={r.id} race={r} recordLabel={recordLabel} />
      ))}
    </ListCard>
  );
}
