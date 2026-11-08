import { View } from 'react-native';

import { makeStyles } from '@/src/design';
import { Button } from '@/src/ui/Button';
import { DayDots } from '@/src/ui/DayDots';
import { Text } from '@/src/ui/Text';

type Action = { label: string; onPress: () => void };

export type EmptyStateProps = {
  reason: 'noPlan' | 'firstSessions' | 'noImport' | 'restWeek' | 'firstDay' | 'noAi';
  /** La phrase. */
  title: string;
  /** La sous-phrase : pourquoi, sans culpabiliser. */
  body: string;
  /** Au plus un bouton plein. */
  primary?: Action;
  secondary?: Action;
  /** Sous les boutons : « « Sans montre » ouvre le coach : dis « 30 minutes samedi » et c'est noté. » */
  caption?: string;
  /**
   * firstSessions : une rangée de cercles (pleins = séances faites) et « Encore 2 séances ».
   * `total` cercles en tout ; `done` décrit chaque séance faite. Jamais de « 0/3 » ni de graphique vide.
   */
  progress?: { remaining: string; done: string[]; total: number };
};

const useStyles = makeStyles((t) => ({
  root: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
  progress: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.space.lg },
  actions: { gap: t.space.md, marginTop: t.space.sm },
}));

/** L'absence comme état : une phrase, une sous-phrase, une action facultative. */
export function EmptyState({ reason, title, body, primary, secondary, caption, progress }: EmptyStateProps) {
  const styles = useStyles();

  return (
    <View style={styles.root} testID={`empty-${reason}`}>
      <Text role="verdict" weight="bold">
        {title}
      </Text>
      <Text role="body" color="inkSecondary">
        {body}
      </Text>
      {progress ? (
        <View style={styles.progress}>
          <DayDots
            compact
            days={Array.from({ length: Math.max(progress.total, progress.done.length) }, (_, i) => ({
              id: String(i),
              state: i < progress.done.length ? 'done' : 'empty',
              accessibilityLabel: i < progress.done.length ? `Fait : ${progress.done[i]}` : undefined,
            }))}
          />
          <Text role="body" weight="semibold">
            {progress.remaining}
          </Text>
        </View>
      ) : null}
      {primary || secondary ? (
        <View style={styles.actions}>
          {primary ? <Button label={primary.label} onPress={primary.onPress} /> : null}
          {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
        </View>
      ) : null}
      {caption ? (
        <Text role="sub" color="inkTertiary">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
