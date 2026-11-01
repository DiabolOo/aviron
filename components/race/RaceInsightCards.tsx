import { Pressable, View } from 'react-native';

import { ConfirmRaceCard } from '@/components/race/ConfirmRaceCard';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { openRace } from '@/src/ui/nav';
import { useRaceInsights } from '@/src/ui/useRaces';

/** Accueil : carte race_pacing (→ débrief) et carte confirm_race (Oui / Non). */
export function RaceInsightCards() {
  const { pacing, confirm } = useRaceInsights();
  if (!pacing && !confirm) return null;

  return (
    <View className="gap-3.5">
      {confirm ? (
        <ConfirmRaceCard
          raceId={confirm.raceId}
          title={confirm.insight.title}
          message={confirm.insight.message}
          suggestedName={confirm.suggestedName}
        />
      ) : null}
      {pacing ? (
        <Pressable onPress={() => openRace(pacing.raceId)} className="active:opacity-70">
          <Card>
            <Text className="text-base font-semibold text-fg">{pacing.insight.title}</Text>
            <Text className="mt-1 text-sm text-muted">{pacing.insight.message}</Text>
            {pacing.extras.map((line) => (
              <Text key={line} className="mt-2 text-sm text-muted">{line}</Text>
            ))}
            <Text className="mt-3 text-sm font-medium text-fg">Voir le débrief</Text>
          </Card>
        </Pressable>
      ) : null}
    </View>
  );
}
