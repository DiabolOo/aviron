import { Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/src/design';
import { ChoiceChips, type Choice } from '@/src/ui/ChoiceChips';
import { Text } from '@/src/ui/Text';

export type CoachSource = 'ai' | 'device' | 'profile';

export const COACH_SOURCE_LABEL: Record<CoachSource, string> = {
  ai: 'Rédigé par l’IA',
  device: 'Calculé sur ton téléphone',
  profile: 'Programme établi d’après ton profil',
};

type Common = {
  /** Défaut « Ton coach » ; une question n'a pas de libellé sauf s'il est passé (`107`, `108`, `215`). */
  label?: string;
  source: CoachSource;
  /** « Environ » : la cause de l'incertitude, dite une fois. */
  approxReason?: string;
  /** Défaut true ; false sur le détail d'une séance. Ignoré pour `ai` : « Rédigé par l'IA » reste toujours. */
  showSource?: boolean;
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
        /** Question : 2 à 4 réponses en un tap ; la puce choisie reste affichée et une autre se touche encore. */
        kind: 'question';
        /** Début de phrase en semibold : « Je vois ton allure, pas ton effort. », « Ton ressenti ». */
        lead?: string;
        body?: string;
        choices: Choice[];
        selected?: string;
        onChoose: (id: string) => void;
        /** Puces par rangée ; défaut : toutes sur une rangée jusqu'à 3, sinon grille 2 × 2. */
        columns?: number;
        /** « Facultatif · ça m'aide à placer tes séances de course autour. » */
        caption?: string;
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
  label: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  link: { minHeight: t.size.buttonCompact, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
}));

/** La voix du coach : un constat, un conseil, une question. */
export function CoachCard(props: CoachCardProps) {
  const styles = useStyles();
  const { colors, size } = useTheme();
  const question = props.kind === 'question';
  const label = props.label ?? (question ? undefined : 'Ton coach');
  const showSource = props.source === 'ai' || props.showSource !== false;

  let content;
  if (props.kind === 'question') {
    content = (
      <>
        <Text role="body" color="inkSecondary">
          {props.lead ? (
            <Text role="body" weight="semibold">
              {props.lead}
            </Text>
          ) : null}
          {props.lead && props.body ? ' ' : null}
          {props.body}
        </Text>
        <ChoiceChips
          choices={props.choices}
          selected={props.selected}
          onChoose={props.onChoose}
          columns={props.columns ?? (props.choices.length <= 3 ? props.choices.length : 2)}
          accessibilityLabel={[props.lead, props.body].filter(Boolean).join(' ')}
        />
        {props.caption ? (
          <Text role="sub" color="inkTertiary">
            {props.caption}
          </Text>
        ) : null}
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
      {label ? (
        <View style={styles.label}>
          <Sparkles color={colors.coach} size={size.pillDot * 2} strokeWidth={size.iconStroke} />
          <Text role="caption" weight="semibold" color="coach">
            {label}
          </Text>
        </View>
      ) : null}
      {content}
      {props.approxReason ? (
        <Text role="caption" color="inkSecondary">{`Environ : ${props.approxReason}`}</Text>
      ) : null}
      {showSource ? (
        <Text role="caption" color="inkTertiary" testID="coach-source">
          {COACH_SOURCE_LABEL[props.source]}
        </Text>
      ) : null}
    </View>
  );
}
