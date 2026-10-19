import { Text } from 'react-native';

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
  return <Text className="text-center text-sm font-medium text-fg/70">• {statusLabel(session)}</Text>;
}
