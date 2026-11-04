import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { HoldToConfirmCard } from '@/components/ui/HoldToConfirmCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import type { ThemePreference } from '@/src/core/types';
import { CountUp } from '@/src/ui/motion/CountUp';

const THEMES = [
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
] as const satisfies readonly { id: ThemePreference; label: string }[];

const SWATCHES = [
  { label: 'Sport', className: 'bg-sport' },
  { label: 'Nutrition', className: 'bg-nutri' },
  { label: 'Forme', className: 'bg-aqua' },
  { label: 'Agent', className: 'bg-iris' },
] as const;

export default function GalleryScreen() {
  const themePreference = usePulseFitStore((s) => s.themePreference);
  const setThemePreference = usePulseFitStore((s) => s.setThemePreference);
  const [done, setDone] = useState(false);
  const [tab, setTab] = useState<'a' | 'b'>('a');

  // Écran de dev uniquement : ne rend rien dans l'app livrée.
  if (!__DEV__) return null;

  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ScreenTitle title="Galerie" />
        <Segmented
          options={THEMES}
          value={themePreference === 'dark' ? 'dark' : 'light'}
          onChange={setThemePreference}
        />

        <Card>
          <Text className="text-[17px] font-semibold text-fg">Couleurs de domaine</Text>
          <View className="mt-3 flex-row gap-2">
            {SWATCHES.map((s) => (
              <View key={s.label} className="flex-1">
                <View className={`h-10 rounded-xl ${s.className}`} />
                <Text className="mt-1.5 text-[13px] text-muted">{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View className="flex-row gap-3.5">
          <Card tint="nutri" className="flex-1">
            <Text className="text-[17px] font-semibold text-fg">Nutrition</Text>
            <CountUp value={850} className="text-[40px] font-bold text-fg" />
          </Card>
          <Card tint="forme" className="flex-1">
            <Text className="text-[17px] font-semibold text-fg">Forme</Text>
            <CountUp value={88} className="text-[40px] font-bold text-fg" />
          </Card>
        </View>

        <Segmented
          options={[
            { id: 'a', label: 'Nutrition' },
            { id: 'b', label: 'Sport' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <HoldToConfirmCard
          done={done}
          onConfirm={() => setDone(true)}
          onUndo={() => setDone(false)}
          label="Valider la séance"
          doneTitle="Séance validée"
          doneSubtitle="Série : 5 jours">
          <Text className="text-[16px] font-medium text-muted">Séance du jour</Text>
          <Text className="text-[28px] font-bold text-fg">Legs</Text>
          <Text className="text-[16px] font-medium text-muted">Maintiens pour valider</Text>
        </HoldToConfirmCard>

        <PrimaryButton label="Bouton principal" onPress={() => undefined} />
        <PrimaryButton variant="ghost" label="Bouton secondaire" onPress={() => undefined} />
      </View>
    </Screen>
  );
}
