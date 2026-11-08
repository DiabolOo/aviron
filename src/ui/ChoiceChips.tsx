import { Pressable, View } from 'react-native';

import { makeStyles, useFontScale, useTheme } from '@/src/design';
import { EFFORT_TONES, type EffortLevel } from '@/src/ui/EffortPill';
import { Text } from '@/src/ui/Text';

export type Choice = { id: string; label: string; effort?: EffortLevel };

export type ChoiceChipsProps = {
  choices: readonly Choice[];
  selected?: string;
  onChoose: (id: string) => void;
  /** Puces de même largeur, `columns` par rangée (3 pour un ressenti, 2 pour une grille 2 × 2). Absent : à la suite. */
  columns?: number;
  /** Lu par le lecteur d'écran avant les choix. */
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
  grid: { gap: t.space.sm },
  row: { flexDirection: 'row', gap: t.space.sm },
  chip: {
    minHeight: t.size.buttonCompact,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space.sm,
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
  },
  cell: { flex: 1, flexBasis: 0 },
  chipOn: { backgroundColor: t.colors.coachSurface, borderColor: t.colors.coach },
  dot: { width: t.size.pillDot, height: t.size.pillDot, borderRadius: t.radius.pill },
  label: { flexShrink: 1, textAlign: 'center' },
}));

/**
 * Réponses en un tap (questions du coach, ressenti, question d'une proposition).
 * La puce choisie reste affichée sur le fond de son effort (ou `coachSurface`) ; une autre se touche encore.
 */
export function ChoiceChips({ choices, selected, onChoose, columns, accessibilityLabel }: ChoiceChipsProps) {
  const styles = useStyles();
  const { colors, opacity, fontScaleBreakpoints } = useTheme();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const perRow = columns === undefined ? undefined : stacked ? 1 : columns;

  const chip = (c: Choice) => {
    const on = c.id === selected;
    const tone = c.effort ? EFFORT_TONES[c.effort] : null;
    const onStyle = on
      ? tone
        ? { backgroundColor: colors[tone.surface], borderColor: colors[tone.surface] }
        : styles.chipOn
      : null;
    return (
      <Pressable
        key={c.id}
        testID={`choice-${c.id}`}
        accessibilityRole="radio"
        accessibilityLabel={c.label}
        accessibilityState={{ checked: on }}
        onPress={() => onChoose(c.id)}
        style={({ pressed }) => [styles.chip, perRow !== undefined && styles.cell, onStyle, pressed && { opacity: opacity.pressed }]}>
        {tone ? <View style={[styles.dot, { backgroundColor: colors[tone.dot] }]} /> : null}
        <Text role="body" weight="semibold" color={on ? (tone ? tone.text : 'coach') : 'ink'} style={styles.label}>
          {c.label}
        </Text>
      </Pressable>
    );
  };

  if (perRow === undefined) {
    return (
      <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
        {choices.map(chip)}
      </View>
    );
  }

  const rows: Choice[][] = [];
  for (let i = 0; i < choices.length; i += perRow) rows.push(choices.slice(i, i + perRow));
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {rows.map((row) => (
        <View key={row.map((c) => c.id).join('|')} style={styles.row}>
          {row.map(chip)}
          {Array.from({ length: perRow - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}
