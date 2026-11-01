import { router } from 'expo-router';

import { RaceDebriefContent } from '@/components/race/RaceDebriefContent';
import { ErrorState } from '@/components/ui/ErrorState';
import { openRace } from '@/src/ui/nav';
import { useRaceDebrief } from '@/src/ui/useRaces';

export function RaceDebriefBody({ id }: { id: string | undefined }) {
  const view = useRaceDebrief(id);

  if (!view) {
    return (
      <ErrorState
        className="mt-10"
        title="Course introuvable"
        description="Cette course n'existe plus ou n'a pas été détectée."
        retryLabel="Retour"
        onRetry={() => router.back()}
      />
    );
  }
  return <RaceDebriefContent view={view} onOpenRace={openRace} />;
}
