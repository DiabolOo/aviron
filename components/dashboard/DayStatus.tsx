import { Text, View } from 'react-native';

import type { WorkoutSession } from '@/lib/types';

type DayStatusProps = {
  session?: WorkoutSession;
};

function statusLabel(session?: WorkoutSession): string {
  if (!session || session.kind === 'rest') return 'Aujourd’hui on recharge les batteries ! 🔋';
  if (session.completed) return 'Séance pliée, bravo ! 🎉';
  return 'C’est l’heure de bouger ! 🚀';
}

export function DayStatus({ session }: DayStatusProps) {
  const done = session?.completed ?? false;

  return (
    <View className="mt-6 flex-row items-center gap-2">
      <View className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-accent' : 'bg-fg/40'}`} />
      <Text className="flex-shrink text-sm text-muted">{statusLabel(session)}</Text>
    </View>
  );
}
