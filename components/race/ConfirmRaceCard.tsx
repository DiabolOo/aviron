import { useState } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text, TextInput } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { activityIdOfRace } from '@/src/core/training/raceView';

type Props = {
  raceId: string;
  title: string;
  message: string;
  /** nom pré-rempli à la confirmation, ex. « Semi-marathon du 13 octobre 2024 » */
  suggestedName: string;
};

export function ConfirmRaceCard({ raceId, title, message, suggestedName }: Props) {
  const confirmRace = usePulseFitStore((s) => s.confirmRace);
  const rejectRace = usePulseFitStore((s) => s.rejectRace);
  const activityId = activityIdOfRace(raceId);
  const originalName = usePulseFitStore((s) => s.activities.find((a) => a.id === activityId)?.name);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState(suggestedName);

  return (
    <Card>
      <Text className="text-base font-semibold text-fg">{title}</Text>
      <Text className="mt-1 text-sm text-muted">{message}</Text>
      {naming ? (
        <View className="mt-4 gap-3">
          <Text className="text-sm text-muted">Nom de la course</Text>
          <TextInput
            accessibilityLabel="Nom de la course"
            value={name}
            onChangeText={setName}
            className="h-[52px] rounded-2xl bg-fg/5 px-4 text-base text-fg"
          />
          {originalName ? (
            <Text testID="original-title-ref" className="text-sm text-muted">
              Titre d’origine : {originalName}
            </Text>
          ) : null}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <PrimaryButton label="Valider" onPress={() => confirmRace(activityId, name)} />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Retour" variant="ghost" onPress={() => setNaming(false)} />
            </View>
          </View>
        </View>
      ) : (
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1">
            <PrimaryButton label="Oui" onPress={() => setNaming(true)} />
          </View>
          <View className="flex-1">
            <PrimaryButton label="Non" variant="ghost" onPress={() => rejectRace(activityId)} />
          </View>
        </View>
      )}
    </Card>
  );
}
