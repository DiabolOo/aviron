import { Text } from 'react-native';

import { MacroSummary } from '@/components/nutrition/MacroSummary';
import { MealJournal } from '@/components/nutrition/MealJournal';
import { ScanButton } from '@/components/nutrition/ScanButton';
import { Label } from '@/components/ui/Label';
import { Screen } from '@/components/ui/Screen';
import { useTodayStats } from '@/lib/store';

export default function NutritionScreen() {
  const { profile, consumed, todaysMeals } = useTodayStats();

  return (
    <Screen>
      <Label className="mt-2">Aujourd’hui</Label>
      <Text className="mt-2 text-3xl font-semibold tracking-tight text-fg">Nutrition</Text>
      <ScanButton />
      <MacroSummary consumed={consumed} target={profile.macrosTarget} />
      <MealJournal meals={todaysMeals} />
    </Screen>
  );
}
