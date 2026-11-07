import { Modal, Pressable } from 'react-native';

import { addDaysISO } from '@/src/core/dates';
import type { WorkoutSession as PlannedSession } from '@/src/core/types';
import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type PostponeSheetProps = {
  visible: boolean;
  today: string;
  plannedSessions: PlannedSession[];
  unavailableDates?: string[];
  /** null = l'utilisateur a choisi « Sauter » ; undefined = annulé. */
  onChoice: (targetDate: string | null) => void;
  onClose: () => void;
};

/** Vérifie si un jour a déjà une séance non sautée. */
function dayHasSession(sessions: readonly PlannedSession[], date: string): boolean {
  return sessions.some((s) => s.date === date && !s.completed && !s.skipped);
}

/** « Pas deux séances dures d\u2019affilée » : renvoie true si placer ici créerait une succession. */
function wouldCreateHardSequence(
  sessions: readonly PlannedSession[],
  targetDate: string,
  sessionKind: string,
): boolean {
  if (sessionKind === 'rest') return false;
  const prev = addDaysISO(targetDate, -1);
  const next = addDaysISO(targetDate, 1);
  const isHard = (d: string) =>
    sessions.some((s) => s.date === d && s.kind !== 'rest' && !s.completed && !s.skipped);
  return isHard(prev) || isHard(next);
}

type Choice = {
  label: string;
  date: string | null;
  disabled: boolean;
  reason?: string;
  testID: string;
};

function buildChoices(
  today: string,
  sessions: PlannedSession[],
  unavailableDates: string[] | undefined,
): Choice[] {
  const tomorrow = addDaysISO(today, 1);
  const dayAfter = addDaysISO(today, 2);

  const todaySession = sessions.find((s) => s.date === today && !s.completed && !s.skipped);
  const kind = todaySession?.kind ?? 'run';
  // Exclure la séance déplacée des vérifications de voisinage
  const otherSessions = todaySession ? sessions.filter((s) => s.id !== todaySession.id) : sessions;
  const blocked = new Set(unavailableDates ?? []);

  const choices: Choice[] = [];

  // Demain
  const tomorrowUnavailable = blocked.has(tomorrow);
  const tomorrowBusy = dayHasSession(otherSessions, tomorrow);
  const tomorrowHard = wouldCreateHardSequence(otherSessions, tomorrow, kind);
  choices.push({
    label: 'Demain',
    date: tomorrow,
    disabled: tomorrowUnavailable || tomorrowBusy || tomorrowHard,
    reason: tomorrowUnavailable
      ? 'Jour d\u00e9clar\u00e9 indisponible'
      : tomorrowBusy
        ? 'Journ\u00e9e d\u00e9j\u00e0 occup\u00e9e'
        : tomorrowHard
          ? 'Deux s\u00e9ances dures de suite'
          : undefined,
    testID: 'postpone-demain',
  });

  // Après-demain
  const dayAfterUnavailable = blocked.has(dayAfter);
  const dayAfterBusy = dayHasSession(otherSessions, dayAfter);
  const dayAfterHard = wouldCreateHardSequence(otherSessions, dayAfter, kind);
  choices.push({
    label: 'Apr\u00e8s-demain',
    date: dayAfter,
    disabled: dayAfterUnavailable || dayAfterBusy || dayAfterHard,
    reason: dayAfterUnavailable
      ? 'Jour d\u00e9clar\u00e9 indisponible'
      : dayAfterBusy
        ? 'Journ\u00e9e d\u00e9j\u00e0 occup\u00e9e'
        : dayAfterHard
          ? 'Deux s\u00e9ances dures de suite'
          : undefined,
    testID: 'postpone-apres-demain',
  });

  // Un autre jour (placeholder — ouvre un sélecteur de date à l\u2019étape suivante)
  choices.push({
    label: 'Un autre jour',
    date: addDaysISO(today, 7),
    disabled: false,
    testID: 'postpone-autre-jour',
  });

  // Sauter
  choices.push({
    label: 'Sauter cette s\u00e9ance',
    date: null,
    disabled: false,
    testID: 'postpone-sauter',
  });

  return choices;
}

const useStyles = makeStyles((t) => ({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay },
  sheet: {
    backgroundColor: t.colors.surface,
    borderTopLeftRadius: t.radius.card,
    borderTopRightRadius: t.radius.card,
    padding: t.space.screen,
    paddingBottom: t.space.xl,
    gap: t.space.md,
  },
  option: {
    minHeight: t.size.button,
    justifyContent: 'center',
    paddingHorizontal: t.space.lg,
    borderRadius: t.radius.control,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
  },
  optionDisabled: { opacity: 0.4 },
  cancel: {
    minHeight: t.size.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export function PostponeSheet({
  visible,
  today,
  plannedSessions,
  unavailableDates,
  onChoice,
  onClose,
}: PostponeSheetProps) {
  const styles = useStyles();
  const choices = buildChoices(today, plannedSessions, unavailableDates);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="postpone-sheet">
      <Pressable style={styles.overlay} onPress={onClose} accessibilityRole="none">
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text role="verdict" weight="bold">
            Reporter la s\u00e9ance
          </Text>

          {choices.map((c) => (
            <Pressable
              key={c.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: c.disabled }}
              disabled={c.disabled}
              onPress={() => onChoice(c.date)}
              style={[styles.option, c.disabled && styles.optionDisabled]}
              testID={c.testID}>
              <Text role="body" weight="semibold">
                {c.label}
              </Text>
              {c.reason ? (
                <Text role="caption" color="inkTertiary">
                  {c.reason}
                </Text>
              ) : null}
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.cancel}
            testID="postpone-cancel">
            <Text role="body" weight="semibold" color="inkSecondary">
              Annuler
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
