import { View } from 'react-native';

import { makeStyles, useTheme, type Palette } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type EffortLevel = 'easy' | 'moderate' | 'hard';

/** `planned` : intensité prévue d'une séance ; `felt` : ressenti déclaré après coup (ADR-013). */
export type EffortScale = 'planned' | 'felt';

export type EffortPillProps = { level: EffortLevel; scale: EffortScale } | { level: 'neutral'; label: string };

/** Mot fixe par niveau, sur chacune des deux échelles (SPEC-v3 « Deux échelles d'effort »). */
export const EFFORT_LABEL: Record<EffortScale, Record<EffortLevel, string>> = {
  planned: { easy: 'Facile', moderate: 'Soutenu', hard: 'Intense' },
  felt: { easy: 'Facile', moderate: 'Correct', hard: 'Dur' },
};

export const EFFORT_TONES: Record<EffortLevel, { text: keyof Palette; surface: keyof Palette; dot: keyof Palette }> = {
  easy: { text: 'effortEasy', surface: 'effortEasySurface', dot: 'effortEasyDot' },
  moderate: { text: 'effortModerate', surface: 'effortModerateSurface', dot: 'effortModerateDot' },
  hard: { text: 'effortHard', surface: 'effortHardSurface', dot: 'effortHardDot' },
};

const useStyles = makeStyles((t) => ({
  pill: {
    minHeight: t.size.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    gap: t.space.sm,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.xs,
    borderRadius: t.radius.pill,
  },
  dot: { width: t.size.pillDot, height: t.size.pillDot, borderRadius: t.radius.pill },
  label: { flexShrink: 1 },
}));

/** L'intensité : le mot est toujours affiché, la couleur n'est jamais seule porteuse du sens. */
export function EffortPill(props: EffortPillProps) {
  const { colors, fontScaleCaps } = useTheme();
  const styles = useStyles();
  const tone = props.level === 'neutral' ? null : EFFORT_TONES[props.level];
  const label = props.level === 'neutral' ? props.label : EFFORT_LABEL[props.scale][props.level];
  const a11y = props.level === 'neutral' ? label : `${props.scale === 'felt' ? 'Ressenti' : 'Effort'} : ${label}`;

  return (
    <View
      testID={`effort-${props.level}`}
      accessible
      accessibilityLabel={a11y}
      style={[styles.pill, { backgroundColor: colors[tone?.surface ?? 'surfaceSunken'] }]}>
      {tone ? <View style={[styles.dot, { backgroundColor: colors[tone.dot] }]} /> : null}
      <Text role="caption" weight="semibold" color={tone?.text ?? 'inkSecondary'} cap={fontScaleCaps.pill} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}
