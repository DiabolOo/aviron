import { PenLine } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AddMealSheet } from '@/components/nutrition/AddMealSheet';
import { MacroSummary } from '@/components/nutrition/MacroSummary';
import { MealJournal } from '@/components/nutrition/MealJournal';
import { ScanButton } from '@/components/nutrition/ScanButton';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

export default function NutritionScreen() {
  const { colors } = useTheme();
  const { profile, consumed, todaysMeals } = useTodayStats();
  const addMeal = usePulseFitStore((s) => s.addMeal);
  const [adding, setAdding] = useState(false);

  return (
    <Screen>
      <Label className="mt-2">Aujourd’hui</Label>
      <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">Nutrition</Text>
      <ScanButton />
      <View className="mt-3">
        <PrimaryButton
          variant="ghost"
          label="Ajout manuel"
          icon={<PenLine color={colors.fg} size={16} strokeWidth={1.8} />}
          onPress={() => setAdding(true)}
        />
      </View>
      <MacroSummary consumed={consumed} target={profile.macrosTarget} />
      <MealJournal meals={todaysMeals} />
      <AddMealSheet visible={adding} onClose={() => setAdding(false)} onAdd={addMeal} />
    </Screen>
  );
}
