import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

type Action = { label: string; onPress: () => void };

export type EmptyStateProps = {
  reason: 'noPlan' | 'firstSessions' | 'noImport' | 'restWeek' | 'firstDay';
  /** La phrase. */
  title: string;
  /** La sous-phrase : pourquoi, sans culpabiliser. */
  body: string;
  /** Au plus un bouton plein. */
  primary?: Action;
  secondary?: Action;
  /** firstSessions : « Encore 2 séances » et ce qui est déjà fait. Jamais de « 0/3 » ni de graphique vide. */
  progress?: { remaining: string; done: string[] };
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
  done: { gap: t.space.sm },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  actions: { gap: t.space.md, marginTop: t.space.sm },
}));

/** L'absence comme état : une phrase, une sous-phrase, une action facultative. */
export function EmptyState({ reason, title, body, primary, secondary, progress }: EmptyStateProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();

  return (
    <View style={styles.root} testID={`empty-${reason}`}>
      <Text role="verdict" weight="bold">
        {title}
      </Text>
      <Text role="body" color="inkSecondary">
        {body}
      </Text>
      {progress ? (
        <View style={styles.done}>
          {progress.done.map((item) => (
            <View key={item} style={styles.doneRow} accessible accessibilityLabel={`Fait : ${item}`}>
              <Check color={colors.effortEasy} size={size.icon} strokeWidth={size.iconStrokeStrong} />
              <Text role="sub">{item}</Text>
            </View>
          ))}
          <Text role="body" weight="semibold" color="coach">
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
    </View>
  );
}
