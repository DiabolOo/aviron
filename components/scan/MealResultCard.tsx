import { Image, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { MacroBar } from '@/components/ui/MacroBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { formatKcal } from '@/lib/format';
import type { Meal } from '@/lib/types';

type MealResultCardProps = {
  meal: Meal;
  onSave: () => void;
  onRetry: () => void;
};

export function MealResultCard({ meal, onSave, onRetry }: MealResultCardProps) {
  return (
    <View className="mt-2">
      {meal.photoUri ? (
        <Image
          source={{ uri: meal.photoUri }}
          className="h-56 w-full rounded-4xl"
          resizeMode="cover"
        />
      ) : null}

      <Label className="mt-6">Résultat · {Math.round(meal.confidence * 100)} %</Label>
      <Text className="mt-2 text-2xl font-semibold tracking-tight text-fg">{meal.name}</Text>

      <Text className="mt-6 text-6xl font-semibold tracking-tighter text-fg">
        {formatKcal(meal.macros.calories)}
        <Text className="text-base font-normal tracking-normal text-muted"> kcal</Text>
      </Text>

      <View className="mt-8 flex-row gap-6">
        <MacroBar label="Prot." value={meal.macros.protein} accentClass="bg-accent" />
        <MacroBar label="Gluc." value={meal.macros.carbs} accentClass="bg-aqua" />
        <MacroBar label="Lip." value={meal.macros.fat} accentClass="bg-iris" />
      </View>

      <View className="mt-10 gap-3">
        <PrimaryButton label="Ajouter au journal" onPress={onSave} />
        <PrimaryButton variant="ghost" label="Reprendre" onPress={onRetry} />
      </View>
    </View>
  );
}
