import { router } from 'expo-router';
import { PenLine, ScanLine, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { MealEditSheet } from '@/components/nutrition/MealEditSheet';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { mealMomentForHour } from '@/src/core/dates';
import { formatKcal } from '@/src/core/format';
import type { Meal, MealMoment } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

type MealJournalProps = {
  meals: Meal[];
  onAddMeal: () => void;
};

const MOMENT_LABEL: Record<MealMoment, string> = {
  morning: 'Matin',
  noon: 'Midi',
  snack: 'Collation',
  evening: 'Soir',
};

export function MealJournal({ meals, onAddMeal }: MealJournalProps) {
  const { colors } = useTheme();
  const updateMeal = usePulseFitStore((s) => s.updateMeal);
  const deleteMeal = usePulseFitStore((s) => s.deleteMeal);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const sorted = [...meals].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

  return (
    <>
      {sorted.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Aucun repas ce jour"
          description="Scanne une assiette ou ajoute un repas."
          action={{
            label: 'Scanner une assiette',
            onPress: () => router.push('/scan'),
            icon: <ScanLine color={colors.fg} size={16} strokeWidth={1.8} />,
          }}>
          <PrimaryButton
            variant="ghost"
            label="Ajout manuel"
            icon={<PenLine color={colors.fg} size={16} strokeWidth={1.8} />}
            onPress={onAddMeal}
          />
        </EmptyState>
      ) : (
        <Card className="px-[18px] py-2">
          {sorted.map((meal, i) => (
            <Pressable
              key={meal.id}
              accessibilityRole="button"
              accessibilityLabel={`Modifier ${meal.name}`}
              onPress={() => setEditingMeal(meal)}
              className={`min-h-14 flex-row items-center gap-3 py-3 active:opacity-60 ${
                i > 0 ? 'border-t border-fg/10' : ''
              }`}>
              <Text className="w-[84px] text-[15px] text-muted">
                {MOMENT_LABEL[mealMomentForHour(new Date(meal.loggedAt).getHours())]}
              </Text>
              <Text numberOfLines={1} className="min-w-0 flex-1 text-[17px] font-medium text-fg">
                {meal.name}
              </Text>
              <Text className="text-[17px] font-semibold text-fg">{formatKcal(meal.macros.calories)}</Text>
            </Pressable>
          ))}
        </Card>
      )}
      <MealEditSheet
        meal={editingMeal}
        onClose={() => setEditingMeal(null)}
        onSave={updateMeal}
        onDelete={deleteMeal}
      />
    </>
  );
}
