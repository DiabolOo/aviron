import * as Haptics from 'expo-haptics';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { addDaysISO, toISODate } from '@/lib/dates';
import { usePulseFitStore } from '@/lib/store';
import type { AthleticGoal, AthleticGoalType } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

const GOAL_TYPES: { id: AthleticGoalType; title: string; hint: string }[] = [
  { id: 'race_prep', title: 'Prépa course / événement', hint: '5 km, semi, marathon…' },
  { id: 'muscle_strength', title: 'Gain de force', hint: 'Muscu et progression de charges' },
  { id: 'endurance', title: 'Endurance', hint: 'Tenir plus longtemps' },
  { id: 'fitness', title: 'Entretien / santé', hint: 'Rester actif, sans pression' },
];

const TARGET_PRESETS: Record<AthleticGoalType, string[]> = {
  race_prep: ['10 km', 'Semi-marathon', 'Marathon'],
  muscle_strength: ['Prise de force', 'Prise de muscle'],
  endurance: ['Courir 1 h sans s’arrêter', '20 km'],
  fitness: ['Remise en forme'],
};

const VALUE_PLACEHOLDER: Record<AthleticGoalType, string> = {
  race_prep: 'Temps visé (ex : 1h45)',
  muscle_strength: 'Cible (ex : 10 kg au DCO)',
  endurance: 'Cible (ex : 2h)',
  fitness: 'Précision (optionnel)',
};

const DEADLINES = [
  { id: 'none', label: 'Aucune' },
  { id: '8', label: '8 sem.' },
  { id: '12', label: '12 sem.' },
  { id: '16', label: '16 sem.' },
] as const;

type Deadline = (typeof DEADLINES)[number]['id'];

const GENERATION_MESSAGES = ['Analyse de ton objectif…', 'Construction des semaines…', 'Placement des jalons…'];

export function ProgramWizard() {
  const { colors } = useTheme();
  const existing = usePulseFitStore((s) => s.profile.athleticGoal);
  const setAthleticGoal = usePulseFitStore((s) => s.setAthleticGoal);
  const generateWorkoutProgram = usePulseFitStore((s) => s.generateWorkoutProgram);

  const [step, setStep] = useState(0);
  const [type, setType] = useState<AthleticGoalType | undefined>(existing?.type);
  const [targetName, setTargetName] = useState(existing?.targetName ?? '');
  const [targetValue, setTargetValue] = useState(existing?.targetValue ?? '');
  const [sessions, setSessions] = useState(existing?.weeklySessionsCount ?? 3);
  const [deadline, setDeadline] = useState<Deadline>('none');
  const [generating, setGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(
      () => setMessageIndex((i) => Math.min(i + 1, GENERATION_MESSAGES.length - 1)),
      700,
    );
    const timeout = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      generateWorkoutProgram();
    }, 2300);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [generating, generateWorkoutProgram]);

  const canContinue = step === 0 ? Boolean(type) : step === 1 ? targetName.trim().length > 0 : true;

  const submit = () => {
    if (!type) return;
    const goal: AthleticGoal = {
      type,
      targetName: targetName.trim(),
      targetValue: targetValue.trim() || undefined,
      targetDate: deadline === 'none' ? undefined : addDaysISO(toISODate(new Date()), Number(deadline) * 7),
      weeklySessionsCount: sessions,
    };
    setAthleticGoal(goal);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMessageIndex(0);
    setGenerating(true);
  };

  if (generating) {
    return (
      <Card className="mt-8 items-center gap-4 py-12">
        <ActivityIndicator color={colors.accent} size="large" />
        <Text className="text-base font-semibold text-fg">{GENERATION_MESSAGES[messageIndex]}</Text>
        <Label>Génération IA</Label>
      </Card>
    );
  }

  return (
    <View className="mt-8 gap-5">
      <View className="gap-1">
        <Label>{`Étape ${step + 1} / 3`}</Label>
        <Text className="text-3xl font-semibold tracking-tight text-fg">
          {step === 0 ? 'Définir ton plan d’entraînement' : step === 1 ? 'Ta cible' : 'Ton échéance'}
        </Text>
      </View>

      {step === 0 ? (
        <View className="gap-3">
          {GOAL_TYPES.map((item) => {
            const selected = item.id === type;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setType(item.id);
                  if (item.id !== type) setTargetName(TARGET_PRESETS[item.id][0] ?? '');
                }}
                className={`rounded-3xl border p-5 ${
                  selected ? 'border-fg bg-fg' : 'border-fg/10 bg-surface'
                }`}>
                <Text className={`text-base font-semibold ${selected ? 'text-canvas' : 'text-fg'}`}>
                  {item.title}
                </Text>
                <Text className={`mt-1 text-sm ${selected ? 'text-canvas/70' : 'text-muted'}`}>
                  {item.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {step === 1 && type ? (
        <Card className="gap-5">
          <View className="gap-3">
            <Label>Objectif</Label>
            <View className="flex-row flex-wrap gap-2">
              {TARGET_PRESETS[type].map((preset) => {
                const selected = preset === targetName;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setTargetName(preset);
                    }}
                    className={`rounded-full px-4 py-2 ${selected ? 'bg-fg' : 'bg-fg/5'}`}>
                    <Text className={`text-sm ${selected ? 'font-semibold text-canvas' : 'text-muted'}`}>
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={targetName}
              onChangeText={setTargetName}
              placeholder="Nom de ton objectif"
              placeholderTextColor={colors.muted}
              className="rounded-2xl bg-fg/5 px-4 py-3 text-base text-fg"
            />
            <TextInput
              value={targetValue}
              onChangeText={setTargetValue}
              placeholder={VALUE_PLACEHOLDER[type]}
              placeholderTextColor={colors.muted}
              className="rounded-2xl bg-fg/5 px-4 py-3 text-base text-fg"
            />
          </View>
          <View className="flex-row items-center justify-between border-t border-fg/5 pt-5">
            <Label>Séances / semaine</Label>
            <Stepper value={sessions} step={1} min={2} max={6} unit="x" onChange={setSessions} />
          </View>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="gap-4">
          <Label>Date de l’échéance (optionnelle)</Label>
          <Segmented options={DEADLINES} value={deadline} onChange={setDeadline} />
          <Text className="text-sm text-muted">
            Sans échéance, ton programme dure 8 semaines.
          </Text>
        </Card>
      ) : null}

      <View className="gap-3">
        {step < 2 ? (
          <PrimaryButton label="Continuer" disabled={!canContinue} onPress={() => setStep(step + 1)} />
        ) : (
          <PrimaryButton
            label="Générer mon programme"
            onPress={submit}
            icon={<Sparkles color={colors.accentFg} size={16} strokeWidth={2} />}
          />
        )}
        {step > 0 ? (
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setStep(step - 1);
            }}
            className="flex-row items-center justify-center gap-1 py-2">
            <ChevronLeft color={colors.muted} size={16} strokeWidth={2} />
            <Text className="text-sm text-muted">Retour</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
