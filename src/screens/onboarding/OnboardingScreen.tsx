/**
 * Écran Onboarding (`210`, `216`) — 4 étapes.
 *
 * 1. Niveau (LEVEL_OPTIONS)
 * 2. Équipement (EQUIPMENT_OPTIONS)
 * 3. Objectif (course ou régularité) + date/temps optionnels
 * 4. Consentement (3 niveaux : profil, séances, coach IA)
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { LEVEL_OPTIONS, EQUIPMENT_OPTIONS } from '@/src/core/training/level';
import type { DeclaredLevel, Equipment } from '@/src/core/types';
import { makeStyles, useTheme } from '@/src/design';
import { Button } from '@/src/ui/Button';
import { OptionCard } from '@/src/ui/OptionCard';
import { StepHeader } from '@/src/ui/StepHeader';
import { Text } from '@/src/ui/Text';

// ─── Types ────────────────────────────────────────────────────────────────

type GoalChoice = 'semi' | '10k' | '5k' | 'regular';
type ConsentLevel = 'profile' | 'sessions' | 'ai';

const GOAL_CHOICES: readonly { id: GoalChoice; label: string; description: string }[] = [
  { id: 'semi', label: 'Un semi-marathon', description: 'Environ 12 semaines de préparation ciblée.' },
  { id: '10k', label: 'Un 10 km', description: 'Courir 10 km sans s’arrêter.' },
  { id: '5k', label: 'Courir 5 km sans s’arrêter', description: 'Le premier cap, à ton rythme.' },
  { id: 'regular', label: 'Courir plus régulièrement', description: 'Pas de course cible, juste progresser.' },
];

const CONSENT_OPTIONS: readonly { id: ConsentLevel; label: string; description: string }[] = [
  { id: 'profile', label: 'Avec mon profil', description: 'Un programme d’après tes réponses. Je ne lis aucune séance.' },
  { id: 'sessions', label: 'Avec mes séances', description: 'J’analyse les séances sur ton téléphone. Rien n’en sort.' },
  { id: 'ai', label: 'Avec un coach IA', description: 'Une IA rédige tes débriefs à partir des séances venues de COROS, Garmin ou Apple\u00a0Santé.' },
];

const TOTAL_STEPS = 4;

// ─── Styles ───────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.lg, paddingBottom: t.space.section },
  stepTitle: { paddingTop: t.space.lg },
  cards: { gap: t.space.sm },
  hint: { paddingTop: t.space.xs },
  input: {
    minHeight: t.size.button,
    paddingHorizontal: t.space.lg,
    paddingVertical: t.space.md,
    borderRadius: t.radius.control,
    borderWidth: t.size.hairline,
    borderColor: t.colors.line,
    backgroundColor: t.colors.surface,
    color: t.colors.ink,
    fontSize: t.typography.body.fontSize,
  },
  dateRow: { flexDirection: 'row', gap: t.space.sm },
  dateInput: { flex: 1 },
  nameInput: { marginTop: t.space.sm },
  footer: { paddingHorizontal: t.space.screen, paddingVertical: t.space.md },
  stravaNote: {
    padding: t.space.md,
    borderRadius: t.radius.card,
    backgroundColor: t.colors.surfaceSunken,
    gap: t.space.xs,
  },
}));

// ─── Screen ───────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const completeOnboarding = usePulseFitStore((s) => s.completeOnboarding);
  const setAiConsent = usePulseFitStore((s) => s.setAiConsent);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [level, setLevel] = useState<DeclaredLevel | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [goalChoice, setGoalChoice] = useState<GoalChoice | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [consent, setConsent] = useState<ConsentLevel | null>(null);

  const name = firstName.trim();

  const canContinue =
    step === 0 ? level !== null
    : step === 1 ? equipment !== null
    : step === 2 ? goalChoice !== null
    : step === 3 ? consent !== null
    : false;

  const goalTargetName = goalChoice === 'semi' ? 'Semi-marathon'
    : goalChoice === '10k' ? '10 km'
    : goalChoice === '5k' ? '5 km'
    : undefined;

  const isRace = goalChoice === 'semi' || goalChoice === '10k';

  const finish = useCallback(() => {
    if (!level || !equipment || !goalChoice || !consent) return;
    setAiConsent(consent === 'ai');
    completeOnboarding({
      firstName: name || 'Utilisateur',
      level,
      equipment,
      athleticGoal: {
        type: goalChoice === 'regular' ? 'endurance' : 'race_prep',
        targetName: goalTargetName ?? 'Régularité',
        targetDate: isRace && targetDate ? targetDate : undefined,
        targetValue: isRace && targetTime ? targetTime : undefined,
        weeklySessionsCount: level === 'advanced' ? 4 : level === 'regular' ? 3 : 2,
      },
    });
    router.replace('/(tabs)');
  }, [level, equipment, goalChoice, consent, name, goalTargetName, isRace, targetDate, targetTime, completeOnboarding, setAiConsent]);

  const select = <T,>(setter: (value: T) => void, value: T) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const stepLabel = `${step + 1} sur ${TOTAL_STEPS}`;

  return (
    <View style={styles.root} testID="onboarding-screen">
      <Pressable accessible={false} onPress={Keyboard.dismiss} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: styles.content.paddingHorizontal }}>
          <StepHeader
            step={step + 1}
            total={TOTAL_STEPS}
            label={stepLabel}
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Étape 1 : Niveau ── */}
          {step === 0 && (
            <>
              <View style={styles.stepTitle}>
                <Text role="title">Où en es-tu avec la course\u00a0?</Text>
              </View>
              <Text role="sub" color="inkSecondary">
                Ta réponse règle les mots que j{'’'}emploie et la quantité de chiffres que je te montre.
              </Text>
              <View style={styles.cards}>
                {LEVEL_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    testID={`level-${opt.id}`}
                    title={opt.label}
                    description={opt.description}
                    selected={level === opt.id}
                    onPress={() => select(setLevel, opt.id)}
                  />
                ))}
              </View>
              <View style={styles.hint}>
                <Text role="caption" color="inkTertiary">
                  Modifiable à tout moment dans ton profil.
                </Text>
              </View>
            </>
          )}

          {/* ── Étape 2 : Équipement ── */}
          {step === 1 && (
            <>
              <View style={styles.stepTitle}>
                <Text role="title">Tu cours avec quoi\u00a0?</Text>
              </View>
              <Text role="sub" color="inkSecondary">
                Pour lire tes allures, tes distances. Sinon les repères changent{'\u00a0'}: battements par minute, zones, etc.
              </Text>
              <View style={styles.cards}>
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    testID={`equipment-${opt.id}`}
                    title={opt.label}
                    description={opt.description}
                    selected={equipment === opt.id}
                    onPress={() => select(setEquipment, opt.id)}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Étape 3 : Objectif ── */}
          {step === 2 && (
            <>
              <View style={styles.stepTitle}>
                <Text role="title">Qu{'’'}est-ce que tu vises\u00a0?</Text>
              </View>
              <View style={styles.cards}>
                {GOAL_CHOICES.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    testID={`goal-${opt.id}`}
                    title={opt.label}
                    description={opt.description}
                    selected={goalChoice === opt.id}
                    onPress={() => select(setGoalChoice, opt.id)}
                  />
                ))}
              </View>
              {isRace && (
                <>
                  <View style={styles.dateRow}>
                    <View style={styles.dateInput}>
                      <Text role="caption" color="inkSecondary">Temps visé</Text>
                      <TextInput
                        testID="target-time"
                        value={targetTime}
                        onChangeText={setTargetTime}
                        placeholder="ex. 1h45"
                        placeholderTextColor={colors.inkTertiary}
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.dateInput}>
                      <Text role="caption" color="inkSecondary">Date de la course</Text>
                      <TextInput
                        testID="target-date"
                        value={targetDate}
                        onChangeText={setTargetDate}
                        placeholder="ex. 11 avril 2027"
                        placeholderTextColor={colors.inkTertiary}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <Text role="caption" color="inkTertiary">
                    Une phase de base pourra te préparer, puis 12 semaines de plan ciblé, et les dernières semaines de diminution.
                  </Text>
                </>
              )}
            </>
          )}

          {/* ── Étape 4 : Consentement ── */}
          {step === 3 && (
            <>
              <View style={styles.stepTitle}>
                <Text role="title">Jusqu{'’'}où je t{'’'}accompagne\u00a0?</Text>
              </View>
              {stravaConnected && (
                <View style={styles.stravaNote}>
                  <Text role="sub" weight="semibold">Tes séances arrivent par Strava</Text>
                  <Text role="caption" color="inkSecondary">
                    Elles sont analysées sur ton téléphone, quel que soit ton choix.
                  </Text>
                </View>
              )}
              <View style={styles.cards}>
                {CONSENT_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    testID={`consent-${opt.id}`}
                    title={opt.label}
                    description={opt.description}
                    selected={consent === opt.id}
                    onPress={() => select(setConsent, opt.id)}
                  />
                ))}
              </View>

              {/* ── Prénom ── */}
              <View>
                <Text role="sub" weight="semibold">Comment tu t{'’'}appelles\u00a0?</Text>
                <TextInput
                  testID="first-name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ton prénom"
                  placeholderTextColor={colors.inkTertiary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={24}
                  returnKeyType="done"
                  style={[styles.input, styles.nameInput]}
                />
              </View>
            </>
          )}
        </ScrollView>
      </Pressable>

      <View style={styles.footer}>
        <Button
          testID="continue-button"
          label={step === TOTAL_STEPS - 1 ? 'Commencer' : 'Continuer'}
          onPress={next}
          disabled={!canContinue}
        />
      </View>
    </View>
  );
}
