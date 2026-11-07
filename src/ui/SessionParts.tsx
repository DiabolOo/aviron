import { View } from 'react-native';

import { makeStyles, useTheme, type Palette } from '@/src/design';
import { Text } from '@/src/ui/Text';
import type { SessionPartView } from '@/src/core/training/sessions/sessionView';
import { NBSP } from '@/src/core/sportFormat';

export type SessionPartsProps = {
  /** « La séance en trois temps » */
  title: string;
  /** « 7,9 km · 40:05 » */
  summary: string;
  parts: readonly SessionPartView[];
  /** Couleur de la barre proportionnelle par rôle. */
  sportColor: string;
};

const ROLE_COLORS: Record<string, keyof Palette> = {
  warmup: 'effortEasy',
  main: 'effortHard',
  cooldown: 'effortEasy',
};

const useStyles = makeStyles((t) => ({
  root: { gap: t.space.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  bar: {
    flexDirection: 'row',
    height: t.size.track,
    borderRadius: t.radius.pill,
    overflow: 'hidden',
    gap: t.size.hairline,
  },
  segment: { height: '100%', borderRadius: t.radius.pill },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: t.space.sm,
    paddingVertical: t.space.xs,
  },
  rowLeft: { flexShrink: 1, gap: t.space.xs },
  rowRight: { flexDirection: 'row', gap: t.space.sm, alignItems: 'baseline' },
}));

/** Barre colorée + liste des activités d'une séance regroupée. */
export function SessionParts({ title, summary, parts, sportColor }: SessionPartsProps) {
  const styles = useStyles();
  const { colors } = useTheme();

  // Proportions de la barre : durée relative
  const durations = parts.map((p) => parseDuration(p.durationLabel));
  const total = durations.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.root} testID="session-parts">
      <View style={styles.header}>
        <Text role="body" weight="semibold">{title}</Text>
        <Text role="caption" color="inkTertiary">{summary}</Text>
      </View>
      {total > 0 ? (
        <View style={styles.bar}>
          {parts.map((part, i) => {
            const pct = (durations[i] / total) * 100;
            const roleColor = part.role ? colors[ROLE_COLORS[part.role] ?? 'barNeutral'] : sportColor;
            return (
              <View
                key={part.activityId}
                testID="session-segment"
                style={[styles.segment, { width: `${pct}%`, backgroundColor: roleColor }]}
              />
            );
          })}
        </View>
      ) : null}
      {parts.map((part) => {
        const isMain = part.role === 'main';
        return (
          <View key={part.activityId} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text role="sub" weight={isMain ? 'semibold' : 'regular'}>
                {part.roleLabel ? `${part.roleLabel}${NBSP}·${NBSP}${part.distanceLabel ?? ''}` : part.name}
                {!part.roleLabel && part.distanceLabel ? `${NBSP}·${NBSP}${part.distanceLabel}` : ''}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text role="sub" weight={isMain ? 'semibold' : 'regular'}>
                {part.durationLabel}
              </Text>
              {part.paceLabel ? (
                <Text role="sub" weight={isMain ? 'semibold' : 'regular'} color="inkSecondary">
                  {part.paceLabel}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** « 12:03 » → 723, « 1:02:05 » → 3725. */
function parseDuration(label: string): number {
  const parts = label.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
