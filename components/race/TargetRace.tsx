import { View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { parseISODate } from '@/src/core/dates';

/** Suivi › Objectifs : uniquement la course visée par l'objectif en cours. Null sans objectif de course. */
export function TargetRace() {
  const goal = usePulseFitStore((s) => s.profile.athleticGoal);
  if (goal?.type !== 'race_prep') return null;
  const date = goal.targetDate
    ? parseISODate(goal.targetDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : undefined;

  return (
    <View>
      <Label>Course visée</Label>
      <View className="mt-2 py-4">
        <Text className="text-base text-fg">{goal.targetName}</Text>
        {date || goal.targetValue ? (
          <Text className="mt-0.5 text-sm text-muted">
            {[date, goal.targetValue ? `objectif ${goal.targetValue}` : undefined].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
