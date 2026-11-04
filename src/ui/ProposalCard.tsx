import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { makeStyles, useFontScale, useReduceMotion, useTheme } from '@/src/design';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

export type ProposalRow = {
  /** « Sam. 7 nov. » */
  day: string;
  /** Absent pour une création → « Rien de prévu ». */
  before?: string;
  after: string;
};

export type ProposalQuestion = {
  prompt: string;
  choices: { id: string; label: string }[];
  selected?: string;
  onChoose: (id: string) => void;
};

export type ProposalCardProps = {
  /** « Plan · semaine du 9 nov. » */
  context: string;
  title: string;
  rows: ProposalRow[];
  /** Une phrase, des faits vérifiables. */
  rationale: string;
  /** Ligne « Vérifié par le plan » : la proposition respecte les règles du plan. */
  verified?: boolean;
  /** Affichée en mots seulement si ≠ high. */
  confidence?: 'high' | 'medium' | 'low';
  source: 'ai' | 'device';
  /** Question obligatoire : Valider reste indisponible tant qu'elle n'a pas de réponse. */
  question?: ProposalQuestion;
  status: 'pending' | 'applying' | 'applied';
  /** Sur Aujourd'hui : sans tableau, avec la source. */
  compact?: boolean;
  onAccept: () => void;
  onEdit: () => void;
  onReject?: () => void;
};

export const PROPOSAL_SOURCE_LABEL = { ai: 'Rédigé par l’IA', device: 'Calculé sur ton téléphone' } as const;
const CONFIDENCE_LABEL = { medium: 'Confiance moyenne', low: 'Confiance faible' } as const;
export const QUESTION_PENDING_REASON = 'Réponds d’abord à la question ci-dessus.';

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
  table: { borderRadius: t.radius.control, overflow: 'hidden', gap: t.size.hairline, backgroundColor: t.colors.line },
  row: { flexDirection: 'row', backgroundColor: t.colors.surface },
  rowStacked: { backgroundColor: t.colors.surface, padding: t.space.md, gap: t.space.xs },
  dayCell: { padding: t.space.md, flexBasis: '28%' },
  cell: { flex: 1, padding: t.space.md, backgroundColor: t.colors.surfaceSunken },
  after: { flex: 1, padding: t.space.md, backgroundColor: t.colors.coachSurface },
  head: { flexDirection: 'row' },
  question: { gap: t.space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
  chip: {
    minHeight: t.size.buttonCompact,
    paddingHorizontal: t.space.lg,
    justifyContent: 'center',
    borderRadius: t.radius.pill,
    borderWidth: t.size.outline,
    borderColor: t.colors.line,
  },
  chipOn: { backgroundColor: t.colors.coachSurface, borderColor: t.colors.coach },
  buttons: { flexDirection: 'row', gap: t.space.md },
  buttonsStacked: { gap: t.space.md },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center', alignSelf: 'center' },
  underline: { textDecorationLine: 'underline' },
}));

function Table({ rows, stacked }: { rows: ProposalRow[]; stacked: boolean }) {
  const styles = useStyles();
  if (stacked) {
    return (
      <View style={styles.table}>
        {rows.map((r) => (
          <View key={r.day} style={styles.rowStacked}>
            <Text role="sub" weight="semibold">
              {r.day}
            </Text>
            <Text role="sub" color="inkSecondary">{`Avant : ${r.before ?? 'Rien de prévu'}`}</Text>
            <Text role="sub" weight="semibold" color="coach">{`Après : ${r.after}`}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.table} accessibilityRole="summary">
      <View style={styles.row}>
        <View style={styles.dayCell} />
        <View style={styles.cell}>
          <Text role="caption" weight="semibold" color="inkTertiary">
            Avant
          </Text>
        </View>
        <View style={styles.after}>
          <Text role="caption" weight="semibold" color="coach">
            Après
          </Text>
        </View>
      </View>
      {rows.map((r) => (
        <View
          key={r.day}
          style={styles.row}
          accessible
          accessibilityLabel={`${r.day} : avant, ${r.before ?? 'rien de prévu'} ; après, ${r.after}`}>
          <View style={styles.dayCell}>
            <Text role="sub" weight="semibold">
              {r.day}
            </Text>
          </View>
          <View style={styles.cell}>
            <Text role="sub" color="inkSecondary">
              {r.before ?? 'Rien de prévu'}
            </Text>
          </View>
          <View style={styles.after}>
            <Text role="sub" weight="semibold">
              {r.after}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Une décision à prendre : la proposition du coach, à valider ou modifier. */
export function ProposalCard(props: ProposalCardProps) {
  const { context, title, rows, rationale, verified, confidence, source, question, status, compact } = props;
  const styles = useStyles();
  const { motion, fontScaleBreakpoints } = useTheme();
  const reduce = useReduceMotion();
  const stacked = useFontScale() >= fontScaleBreakpoints.stack;
  const reveal = useSharedValue(1);

  useEffect(() => {
    if (status !== 'applied') return;
    reveal.set(0);
    reveal.set(reduce ? 1 : withTiming(1, { duration: motion.slow, easing: motion.easing }));
  }, [status, reduce, motion, reveal]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.get() }));

  if (status === 'applied') {
    return (
      <Animated.View style={[styles.card, revealStyle]} testID="proposal-applied" accessibilityLiveRegion="polite">
        <Text role="body" weight="semibold">{`Appliqué : ${title}`}</Text>
        <Text role="caption" color="inkTertiary">
          {context}
        </Text>
      </Animated.View>
    );
  }

  const waiting = question !== undefined && question.selected === undefined;
  const footnotes = [
    verified ? 'Vérifié par le plan' : null,
    confidence && confidence !== 'high' ? CONFIDENCE_LABEL[confidence] : null,
    PROPOSAL_SOURCE_LABEL[source],
  ].filter(Boolean);

  return (
    <View style={styles.card} testID={compact ? 'proposal-compact' : 'proposal-pending'}>
      <Text role="caption" weight="semibold" color="coach">
        {context}
      </Text>
      <Text role="verdict" weight="bold">
        {title}
      </Text>
      {compact ? null : <Table rows={rows} stacked={stacked} />}
      <Text role="sub" color="inkSecondary">
        {rationale}
      </Text>
      {question ? (
        <View style={styles.question}>
          <Text role="body" weight="semibold">
            {question.prompt}
          </Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {question.choices.map((c) => {
              const on = c.id === question.selected;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => question.onChoose(c.id)}
                  style={[styles.chip, on && styles.chipOn]}>
                  <Text role="sub" weight="semibold" color={on ? 'coach' : 'ink'}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <Text role="caption" color="inkTertiary" testID="proposal-footnote">
        {footnotes.join(' · ')}
      </Text>
      <View style={stacked ? styles.buttonsStacked : styles.buttons}>
        <Button
          testID="proposal-accept"
          label="Valider"
          onPress={props.onAccept}
          busy={status === 'applying'}
          disabled={waiting}
          disabledReason={QUESTION_PENDING_REASON}
        />
        <Button label="Modifier" variant="secondary" onPress={props.onEdit} disabled={status === 'applying'} />
      </View>
      {props.onReject && status === 'pending' ? (
        <Pressable accessibilityRole="button" onPress={props.onReject} style={styles.link}>
          <Text role="sub" weight="semibold" style={styles.underline}>
            Pas maintenant
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
