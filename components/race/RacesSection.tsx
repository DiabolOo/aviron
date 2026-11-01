import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ConfirmRaceCard } from '@/components/race/ConfirmRaceCard';
import { Label } from '@/components/ui/Label';
import { Text } from '@/components/ui/Text';
import { parseISODate, toISODate } from '@/src/core/dates';
import { candidateSummaryFr, formatPaceKm, formatRaceTime, isStaleCandidate, suggestRaceName } from '@/src/core/training/raceView';
import { openRace } from '@/src/ui/nav';
import { useRaceLists } from '@/src/ui/useRaces';
import { useTheme } from '@/src/ui/useTheme';

const shortDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Suivi › Sport, en bas : « À confirmer » (candidates de plus de 28 jours — les récentes passent par
 * l'Accueil) puis « Courses passées ». Masquée sans course confirmée ni candidate à confirmer.
 */
export function RacesSection() {
  const { confirmed, pending } = useRaceLists();
  const { colors } = useTheme();
  const today = toISODate(new Date());
  const toConfirm = pending.filter((race) => isStaleCandidate(race, today));
  if (confirmed.length === 0 && toConfirm.length === 0) return null;

  return (
    <View className="mt-10 gap-8">
      <Label>Courses</Label>

      {toConfirm.length > 0 ? (
        <View className="gap-3.5">
          <Label>À confirmer</Label>
          {toConfirm.map((race) => (
            <ConfirmRaceCard
              key={race.id}
              raceId={race.id}
              title="C’était une course ?"
              message={candidateSummaryFr(race)}
              suggestedName={suggestRaceName(race)}
            />
          ))}
        </View>
      ) : null}

      {confirmed.length > 0 ? (
        <View>
          <Label>Courses passées</Label>
          <View className="mt-2">
            {confirmed.map((race, index) => (
              <Pressable
                key={race.id}
                onPress={() => openRace(race.id)}
                className={`flex-row items-center gap-3 py-4 active:opacity-70 ${index > 0 ? 'border-t border-fg/5' : ''}`}>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-base text-fg">{race.name}</Text>
                  <Text className="mt-0.5 text-sm text-muted">{shortDate(race.date)}</Text>
                </View>
                {race.timeSec !== undefined ? (
                  <View className="items-end">
                    <Text className="text-base font-semibold text-fg">{formatRaceTime(race.timeSec)}</Text>
                    <Text className="mt-0.5 text-sm text-muted">
                      {formatPaceKm(race.timeSec / race.officialDistanceKm)} /km
                    </Text>
                  </View>
                ) : null}
                <ChevronRight color={colors.muted} size={18} strokeWidth={1.8} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
