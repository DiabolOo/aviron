import { Text, View } from 'react-native';

import { ConnectionSwitch } from '@/components/profile/ConnectionSwitch';
import { SettingRow } from '@/components/profile/SettingRow';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Stepper } from '@/components/ui/Stepper';
import { usePulseFitStore } from '@/lib/store';
import type { ThemePreference } from '@/lib/types';

const THEMES = [
  { id: 'system', label: 'Auto' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
] as const satisfies readonly { id: ThemePreference; label: string }[];

function weightHint(current: number, target: number): string {
  const diff = Number((current - target).toFixed(1));
  if (diff === 0) return 'Objectif atteint';
  return diff > 0 ? `${diff} kg à perdre` : `${Math.abs(diff)} kg à prendre`;
}

export default function ProfileScreen() {
  const profile = usePulseFitStore((s) => s.profile);
  const updateProfile = usePulseFitStore((s) => s.updateProfile);
  const setCalorieTarget = usePulseFitStore((s) => s.setCalorieTarget);
  const stravaConnected = usePulseFitStore((s) => s.stravaConnected);
  const watchConnected = usePulseFitStore((s) => s.watchConnected);
  const toggleStrava = usePulseFitStore((s) => s.toggleStrava);
  const toggleWatch = usePulseFitStore((s) => s.toggleWatch);
  const themePreference = usePulseFitStore((s) => s.themePreference);
  const setThemePreference = usePulseFitStore((s) => s.setThemePreference);

  return (
    <Screen>
      <View className="mt-2 flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-fg">
          <Text className="text-2xl font-semibold text-canvas">
            {profile.firstName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-3xl font-semibold tracking-tight text-fg">{profile.firstName}</Text>
          <Text className="mt-1 text-sm text-muted">{profile.goalLabel}</Text>
        </View>
      </View>

      <Label className="mt-10">Objectifs</Label>
      <Card className="mt-3 py-1">
        <SettingRow first label="Poids actuel">
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
      </Card>

      <Label className="mt-8">Connexions</Label>
      <Card className="mt-3 py-1">
        <SettingRow first label="Strava" hint={stravaConnected ? 'Synchronisé' : 'Non connecté'}>
          <ConnectionSwitch label="Strava" value={stravaConnected} onToggle={toggleStrava} />
        </SettingRow>
        <SettingRow label="Montre" hint={watchConnected ? 'Garmin · synchronisée' : 'Non connectée'}>
          <ConnectionSwitch label="Montre" value={watchConnected} onToggle={toggleWatch} />
        </SettingRow>
      </Card>

      <Label className="mt-8">Apparence</Label>
      <Segmented
        className="mt-3"
        options={THEMES}
        value={themePreference}
        onChange={setThemePreference}
      />

      <Text className="mt-10 text-center font-mono text-[10px] uppercase tracking-[2px] text-muted">
        PulseFit · MVP
      </Text>
    </Screen>
  );
}
