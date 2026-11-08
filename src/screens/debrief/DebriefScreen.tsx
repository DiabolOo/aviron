import { useLocalSearchParams } from 'expo-router';

import { useResolvedSession } from '@/src/screens/activity/useResolvedSession';
import { PlaceholderScreen } from '@/src/ui/PlaceholderScreen';
import { useSportDerived } from '@/src/ui/useRaces';

/** Débrief de course (`212`), ouvert depuis Progrès › Tes semis : le retour porte le nom de la course. Écran provisoire. */
export function DebriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useResolvedSession(id);
  const derived = useSportDerived();
  const activityId = session?.activityIds[0];
  const raceId = activityId ? derived.confirmedRaceMap.get(activityId) : undefined;
  const raceTitle = derived.raceDebrief(raceId)?.title;

  return <PlaceholderScreen title="Ta course en trois temps" back={raceTitle ?? 'Progrès'} />;
}
