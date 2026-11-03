import { router, useLocalSearchParams } from 'expo-router';
import { Unplug } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ConnectionSwitch } from '@/components/profile/ConnectionSwitch';
import { GoalSheet } from '@/components/profile/GoalSheet';
import { MaxHrField } from '@/components/profile/MaxHrField';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SettingRow } from '@/components/profile/SettingRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { usePulseFitStore } from '@/lib/store';
import { inferGoal } from '@/src/core/nutritionCalculator';
import { toISODate } from '@/src/core/dates';
import { resolveMaxHr } from '@/src/core/training/engine';
import type { ThemePreference } from '@/src/core/types';
import { stravaToActivity } from '@/src/data/mappers';

const THEMES = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
] as const satisfies readonly { id: ThemePreference; label: string }[];

const TITLES = { objectifs: 'Objectifs', connexions: 'Connexions', apparence: 'Apparence' } as const;

function weightHint(current: number, target: number): string {
  const diff = Number((current - target).toFixed(1));
  if (diff === 0) return 'Objectif atteint';
  return diff > 0 ? `${diff} kg à perdre` : `${Math.abs(diff)} kg à prendre`;
}

const MAX_HR_SOURCE_LABEL = {
  configured: 'saisie',
  observed: 'observée sur 12 mois',
  estimated: 'estimée d’après l’âge',
} as const;

function Goals() {
  const profile = usePulseFitStore((s) => s.profile);
  const activities = usePulseFitStore((s) => s.activities);
  const updateProfile = usePulseFitStore((s) => s.updateProfile);
  const setCalorieTarget = usePulseFitStore((s) => s.setCalorieTarget);
  const [goalSheet, setGoalSheet] = useState(false);
  const nutritionGoal = profile.goal ?? inferGoal(profile.weightKg, profile.targetWeightKg);
  const autoMaxHr = resolveMaxHr({
    activities: activities.map(stravaToActivity),
    today: toISODate(new Date()),
    ageYears: profile.ageYears,
  });
  const maxHrHint = profile.maxHr
    ? 'saisie'
    : autoMaxHr
      ? `auto : ${autoMaxHr.maxHr} bpm (${MAX_HR_SOURCE_LABEL[autoMaxHr.source]})`
      : 'Non renseignée';

  return (
    <Card className="py-1">
      <SettingRow first label="Objectif sportif" hint={profile.goalLabel} onPress={() => setGoalSheet(true)} />
      <SettingRow label="Poids actuel">
        <Stepper
          value={profile.weightKg}
          step={0.5}
          min={35}
          max={200}
          decimals={1}
          unit="kg"
          onChange={(weightKg) => updateProfile({ weightKg })}
        />
      </SettingRow>
      <SettingRow label="Poids cible" hint={weightHint(profile.weightKg, profile.targetWeightKg)}>
        <Stepper
          value={profile.targetWeightKg}
          step={0.5}
          min={35}
          max={200}
          decimals={1}
          unit="kg"
          onChange={(targetWeightKg) => updateProfile({ targetWeightKg })}
        />
      </SettingRow>
      {nutritionGoal !== 'maintenance' ? (
        <SettingRow label={nutritionGoal === 'weight_loss' ? 'Rythme de perte' : 'Rythme de prise'}>
          <Stepper
            value={profile.weeklyPaceKg ?? 0.5}
            step={0.1}
            min={0.1}
            max={1}
            decimals={1}
            unit="kg/sem"
            onChange={(weeklyPaceKg) => updateProfile({ weeklyPaceKg })}
          />
        </SettingRow>
      ) : null}
      <SettingRow label="FC max" hint={maxHrHint}>
        <MaxHrField
          value={profile.maxHr}
          autoValue={autoMaxHr?.maxHr}
          onChange={(maxHr) => updateProfile({ maxHr })}
        />
      </SettingRow>
      <SettingRow label="Calories / jour">
        <Stepper
          value={profile.calorieTarget}
          step={50}
          min={1200}
          max={5000}
          unit="kcal"
          onChange={setCalorieTarget}
        />
      </SettingRow>
      <GoalSheet
        visible={goalSheet}
        goal={profile.goalLabel}
        onClose={() => setGoalSheet(false)}
        onSave={(goalLabel) => updateProfile({ goalLabel })}
      />
    </Card>
  );
}

function Connections() {
  const strava = usePulseFitStore((s) => s.stravaConnected);
  const watch = usePulseFitStore((s) => s.watchConnected);
  const toggleStrava = usePulseFitStore((s) => s.toggleStrava);
  const toggleWatch = usePulseFitStore((s) => s.toggleWatch);

  return (
    <View className="gap-3.5">
      {!strava && !watch ? (
        <EmptyState
          compact
          icon={Unplug}
          title="Aucun appareil connecté"
          description="Active une source pour synchroniser tes données."
        />
      ) : null}
      <Card className="py-1">
        <SettingRow first label="Strava" hint={strava ? 'Synchronisé' : 'Non connecté'}>
          <ConnectionSwitch label="Strava" value={strava} onToggle={toggleStrava} />
        </SettingRow>
        <SettingRow label="Montre" hint={watch ? 'Synchronisée' : 'Non connectée'}>
          <ConnectionSwitch label="Montre" value={watch} onToggle={toggleWatch} />
        </SettingRow>
      </Card>
    </View>
  );
}

function Appearance() {
  const theme = usePulseFitStore((s) => s.themePreference);
  const setTheme = usePulseFitStore((s) => s.setThemePreference);

  return (
    <View className="gap-3.5">
      <Segmented options={THEMES} value={theme} onChange={setTheme} />
      {__DEV__ ? (
        <Card className="py-1">
          <SettingRow first label="Galerie de composants" onPress={() => router.push('/gallery')} />
        </Card>
      ) : null}
    </View>
  );
}

export default function ProfileSectionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const section = id === 'connexions' || id === 'apparence' ? id : 'objectifs';

  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ProfileHeader title={TITLES[section]} backLabel="Profil" backTo="/profile" />
        {section === 'objectifs' ? <Goals /> : section === 'connexions' ? <Connections /> : <Appearance />}
      </View>
    </Screen>
  );
}
