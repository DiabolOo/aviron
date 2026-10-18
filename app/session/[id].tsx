import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { SessionDetail } from '@/components/sport/SessionDetail';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore } from '@/lib/store';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = usePulseFitStore((s) => s.sessions.find((item) => item.id === id));
  const completeSession = usePulseFitStore((s) => s.completeSession);

  if (!session) {
    return (
      <Screen>
        <ErrorState
          className="mt-10"
          title="Séance introuvable"
          description="Cette séance n'existe plus ou n'a pas été synchronisée."
          retryLabel="Retour"
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="pt-2">
        <SessionDetail session={session} onComplete={completeSession} />
      </View>
    </Screen>
  );
}
