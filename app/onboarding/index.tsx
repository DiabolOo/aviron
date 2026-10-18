import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { CalculatingStep } from '@/components/onboarding/CalculatingStep';
import { StepProgress } from '@/components/onboarding/StepProgress';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import {
    ACTIVITY_LEVELS,
    SEX_OPTIONS,
    SPORT_OPTIONS,
    buildProfileFromOnboarding,
} from '@/lib/onboarding';
import { usePulseFitStore } from '@/lib/store';
import type { ActivityLevel, MainSport, Sex } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

const TOTAL_STEPS = 5;
const CALCULATING_STEP = TOTAL_STEPS - 1;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const completeOnboarding = usePulseFitStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [ageYears, setAgeYears] = useState(30);
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [mainSport, setMainSport] = useState<MainSport | null>(null);

  const name = firstName.trim();
  const canContinue =
    step === 0
      ? name.length > 0 && sex !== null
      : step === 2
        ? activityLevel !== null
        : step === 3
          ? mainSport !== null
          : true;

  const finish = useCallback(() => {
    if (!sex || !activityLevel || !mainSport) return;
    completeOnboarding(
      buildProfileFromOnboarding(name, {
        sex,
        ageYears,
        heightCm,
        weightKg,
        activityLevel,
        mainSport,
      }),
    );
    router.replace('/(tabs)');
  }, [sex, activityLevel, mainSport, name, ageYears, heightCm, weightKg, completeOnboarding]);

  const select = <T,>(setter: (value: T) => void, value: T) => {
    void Haptics.selectionAsync();
    setter(value);
  };

  return (
    <Screen scroll={false} withSafeBottom>
      {step < CALCULATING_STEP && (
        <View className="flex-row items-center gap-4">
          {step > 0 ? (
            <Pressable
              accessibilityLabel="Retour"
              onPress={() => setStep(step - 1)}
              className="h-9 w-9 items-center justify-center rounded-full bg-fg/5 active:opacity-60">
              <ChevronLeft color={colors.fg} size={18} strokeWidth={2} />
            </Pressable>
          ) : null}
          <StepProgress step={step} total={TOTAL_STEPS} />
        </View>
      )}

      <Pressable accessible={false} onPress={Keyboard.dismiss} className="flex-1 pt-8">
        {step === 0 && (
          <View className="gap-8">
            <Text className="text-3xl font-semibold tracking-tight text-fg">
              Comment vous appelez-vous ?
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Votre prénom"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={24}
              returnKeyType="done"
              className="rounded-2xl border border-fg/10 bg-surface px-5 py-4 text-lg text-fg"
            />
            <View className="gap-3">
              <Label>Genre</Label>
              <View className="flex-row flex-wrap gap-2">
                {SEX_OPTIONS.map((option) => {
                  const selected = sex === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => select(setSex, option.id)}
                      className={`rounded-full border px-5 py-3 ${
                        selected ? 'border-fg bg-fg' : 'border-fg/10 bg-surface'
                      }`}>
                      <Text
                        className={`text-sm font-semibold ${selected ? 'text-canvas' : 'text-fg'}`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {step === 1 && (
          <View className="gap-8">
            <Text className="text-3xl font-semibold tracking-tight text-fg">
              Parlez-nous de votre corps
            </Text>
            <Card>
              <View className="flex-row items-center justify-between py-3">
                <Label>Âge</Label>
                <Stepper value={ageYears} step={1} min={14} max={99} unit="ans" onChange={setAgeYears} />
              </View>
              <View className="flex-row items-center justify-between border-t border-fg/5 py-3">
                <Label>Taille</Label>
                <Stepper value={heightCm} step={1} min={120} max={220} unit="cm" onChange={setHeightCm} />
              </View>
              <View className="flex-row items-center justify-between border-t border-fg/5 py-3">
                <Label>Poids</Label>
                <Stepper
                  value={weightKg}
                  step={0.5}
                  min={35}
                  max={200}
                  unit="kg"
                  decimals={1}
                  onChange={setWeightKg}
                />
              </View>
            </Card>
          </View>
        )}

        {step === 2 && (
          <View className="gap-8">
            <Text className="text-3xl font-semibold tracking-tight text-fg">
              Quel est votre niveau d’activité ?
            </Text>
            <View className="gap-3">
              {ACTIVITY_LEVELS.map((level) => {
                const selected = activityLevel === level.id;
                return (
                  <Pressable
                    key={level.id}
                    onPress={() => select(setActivityLevel, level.id)}
                    className={`rounded-3xl border-2 p-5 ${
                      selected ? 'border-accent bg-accent/10' : 'border-fg/5 bg-surface'
                    }`}>
                    <Text className="text-lg font-semibold text-fg">{level.label}</Text>
                    <Text className="mt-1 text-sm text-muted">{level.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-8">
            <Text className="text-3xl font-semibold tracking-tight text-fg">
              Quelle est votre pratique principale ?
            </Text>
            <View className="gap-3">
              {SPORT_OPTIONS.map((sport) => {
                const selected = mainSport === sport.id;
                return (
                  <Pressable
                    key={sport.id}
                    onPress={() => select(setMainSport, sport.id)}
                    className={`flex-row items-center gap-4 rounded-3xl border-2 px-5 py-4 ${
                      selected ? 'border-accent bg-accent/10' : 'border-fg/5 bg-surface'
                    }`}>
                    <Text className="text-3xl">{sport.emoji}</Text>
                    <Text className="text-lg font-semibold text-fg">{sport.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === CALCULATING_STEP && <CalculatingStep firstName={name} onDone={finish} />}
      </Pressable>

      {step < CALCULATING_STEP && (
        <PrimaryButton
          label="Continuer"
          disabled={!canContinue}
          onPress={() => setStep(step + 1)}
        />
      )}
    </Screen>
  );
}
