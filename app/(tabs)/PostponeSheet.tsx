import { Modal, Pressable } from 'react-native';

import { addDaysISO } from '@/src/core/dates';
import type { WorkoutSession } from '@/src/core/types';
import { makeStyles } from '@/src/design';
import { Text } from '@/src/ui/Text';

export type PostponeSheetProps = {
  visible: boolean;
  today: string;
  sessions: WorkoutSession[];
  onChoice: (targetDate: string | null) => void;
  onClose: () => void;
};

/** Vérifie si un jour a déjà une séance. */
function dayHasSession(sessions: readonly WorkoutSession[], date: string): boolean {
  return sessions.some((s) => s.date === date && !s.completed);
}

/** « Pas deux séances dures d'affilée » : renvoie true si placer ici créerait une succession. */
function wouldCreateHardSequence(
  sessions: readonly WorkoutSession[],
  targetDate: string,
  sessionKind: string,
): boolean {
  if (sessionKind === 'rest') return false;
  const prev = addDaysISO(targetDate, -1);
  const next = addDaysISO(targetDate, 1);
  const isHard = (d: string) => sessions.some((s) => s.date === d && s.kind !== 'rest' && !s.completed);
  return isHard(prev) || isHard(next);
}

type Choice = { label: string; date: string | null; disabled: boolean; reason?: string };

function buildChoices(today: string, sessions: WorkoutSession[]): Choice[] {
  const tomorrow = addDaysISO(today, 1);
  const dayAfter = addDaysISO(today, 2);

  const todaySession = sessions.find((s) => s.date === today && !s.completed);
  const kind = todaySession?.kind ?? 'run';
  // Exclure la séance déplacée des vérifications de voisinage
  const otherSessions = todaySession ? sessions.filter((s) => s.id !== todaySession.id) : sessions;

  const choices: Choice[] = [];

  // Demain
  const tomorrowBusy = dayHasSession(otherSessions, tomorrow);
  const tomorrowHard = wouldCreateHardSequence(otherSessions, tomorrow, kind);
  choices.push({
    label: 'Demain',
    date: tomorrow,
    disabled: tomorrowBusy || tomorrowHard,
    reason: tomorrowBusy ? 'Journée déjà occupée' : tomorrowHard ? 'Deux séances dures de suite' : undefined,
  });

  // Après-demain
  const dayAfterBusy = dayHasSession(otherSessions, dayAfter);
  const dayAfterHard = wouldCreateHardSequence(otherSessions, dayAfter, kind);
  choices.push({
    label: 'Après-demain',
    date: dayAfter,
    disabled: dayAfterBusy || dayAfterHard,
    reason: dayAfterBusy ? 'Journée déjà occupée' : dayAfterHard ? 'Deux séances dures de suite' : undefined,
  });

  // Sauter
  choices.push({ label: 'Sauter cette séance', date: null, disabled: false });

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

export function PostponeSheet({ visible, today, sessions, onChoice, onClose }: PostponeSheetProps) {
  const styles = useStyles();
  const choices = buildChoices(today, sessions);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="postpone-sheet">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text role="verdict" weight="bold">
            Reporter la séance
          </Text>

          {choices.map((c) => (
            <Pressable
              key={c.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: c.disabled }}
              disabled={c.disabled}
              onPress={() => {
                if (c.date === null) {
                  // Sauter : on déplace à une date lointaine pour l'écarter
                  onChoice(addDaysISO(today, 365));
                } else {
                  onChoice(c.date);
                }
              }}
              style={[styles.option, c.disabled && styles.optionDisabled]}
              testID={`postpone-${c.label.toLowerCase().replace(/\s+/g, '-')}`}>
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
