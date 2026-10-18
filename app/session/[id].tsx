import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { SessionDetail } from '@/components/training/SessionDetail';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore } from '@/lib/store';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = usePulseFitStore((s) => s.sessions.find((item) => item.id === id));
  const completeSession = usePulseFitStore((s) => s.completeSession);

  if (!session) {
    return (
      <Screen>
        <Text className="text-muted">Séance introuvable.</Text>
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
