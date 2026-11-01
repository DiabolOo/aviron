import { Pressable, View } from 'react-native';

import { ConfirmRaceCard } from '@/components/race/ConfirmRaceCard';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { nbspUnits } from '@/src/core/sportFormat';
import { formatRaceTime } from '@/src/core/training/raceView';
import { openRace } from '@/src/ui/nav';
import { useRaceInsights } from '@/src/ui/useRaces';

/** Accueil : carte de la course des 7 derniers jours (toute la carte ouvre le débrief) et carte confirm_race (Oui / Non). */
export function RaceInsightCards() {
  const { race, confirm } = useRaceInsights();
  if (!race && !confirm) return null;

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
      {race ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${race.title}, ${formatRaceTime(race.timeSec)}`}
          testID="race-card"
          onPress={() => openRace(race.raceId)}
          className="active:opacity-70">
          <Card>
            <Text numberOfLines={2} className="text-base font-semibold text-fg">{race.title}</Text>
            <Text testID="race-card-time" className="mt-1 text-4xl font-semibold tracking-tighter text-fg">
              {formatRaceTime(race.timeSec)}
            </Text>
            {race.line ? (
              <Text testID="race-card-line" className="mt-2 text-sm text-muted">{nbspUnits(race.line)}</Text>
            ) : null}
          </Card>
        </Pressable>
      ) : null}
    </View>
  );
}
