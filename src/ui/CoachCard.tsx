import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type CoachSource = 'ai' | 'device' | 'profile';

export const COACH_SOURCE_LABEL: Record<CoachSource, string> = {
  ai: 'Rédigé par l’IA',
  device: 'Calculé sur ton téléphone',
  profile: 'Programme établi d’après ton profil',
};

type Choice = { id: string; label: string };

type Common = {
  /** Défaut « Ton coach ». */
  label?: string;
  /** Obligatoire : affichée en bas de chaque carte. */
  source: CoachSource;
  /** « Environ » : la cause de l'incertitude, dite une fois. */
  approxReason?: string;
};

export type CoachCardProps = Common &
  (
    | { /** Constat : verdict + explication (facultative : une réponse courte tient dans le verdict). */ kind: 'insight'; verdict: string; body?: string }
    | {
        /** Conseil : verdict + explication + action facultative. */
        kind: 'advice';
        verdict: string;
        body: string;
        action?: { label: string; onPress: () => void };
      }
    | {
        /** Question : 2 à 4 réponses en un tap ; repliée en « Noté : … » une fois répondue. */
        kind: 'question';
        body: string;
        choices: Choice[];
        selected?: string;
        onChoose: (id: string) => void;
      }
  );

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    padding: t.space.screen,
    gap: t.space.md,
  },
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
  label: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  noted: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.space.md },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
}));

/** La voix du coach : un constat, un conseil, une question. */
export function CoachCard(props: CoachCardProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const [changing, setChanging] = useState(false);
  const label = props.label ?? 'Ton coach';
  const sourceLabel = COACH_SOURCE_LABEL[props.source];

  let content;
  if (props.kind === 'question') {
    const picked = props.choices.find((c) => c.id === props.selected);
    content =
      picked && !changing ? (
        <View style={styles.noted}>
          <Text role="body" weight="semibold">{`Noté : ${picked.label}`}</Text>
          <Pressable accessibilityRole="button" onPress={() => setChanging(true)} style={styles.link}>
            <Text role="sub" weight="semibold" style={styles.underline}>
              Changer
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text role="body">{props.body}</Text>
          <View style={styles.chips} accessibilityRole="radiogroup">
            {props.choices.map((c) => {
              const on = c.id === props.selected;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    setChanging(false);
                    props.onChoose(c.id);
                  }}
                  style={[styles.chip, on && styles.chipOn]}>
                  <Text role="sub" weight="semibold" color={on ? 'coach' : 'ink'}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      );
  } else {
    content = (
      <>
        <Text role="verdict" weight="bold">
          {props.verdict}
        </Text>
        {props.body ? (
          <Text role="body" color="inkSecondary">
            {props.body}
          </Text>
        ) : null}
        {props.kind === 'advice' && props.action ? (
          <Pressable accessibilityRole="button" onPress={props.action.onPress} style={styles.link}>
            <Text role="body" weight="semibold" style={styles.underline}>
              {props.action.label}
            </Text>
          </Pressable>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.card} testID={`coach-card-${props.kind}`}>
      <View style={styles.label}>
        <Sparkles color={colors.coach} size={size.pillDot * 2} strokeWidth={size.iconStroke} />
        <Text role="caption" weight="semibold" color="coach">
          {label}
        </Text>
      </View>
      {content}
      {props.approxReason ? (
        <Text role="caption" color="inkSecondary">{`Environ : ${props.approxReason}`}</Text>
      ) : null}
      <Text role="caption" color="inkTertiary" testID="coach-source">
        {sourceLabel}
      </Text>
    </View>
  );
}
