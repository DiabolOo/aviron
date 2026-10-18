import { Zap } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

export function getIntensity(session: Pick<WorkoutSession, 'durationMin' | 'caloriesBurn'>): number {
  const kcalPerMin = session.caloriesBurn / Math.max(session.durationMin, 1);
  return Math.min(5, Math.max(1, Math.round(kcalPerMin / 2.5)));
}

function Column({ label, last, children }: { label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <View className={`flex-1 items-center px-2 ${last ? '' : 'border-r border-fg/10'}`}>
      {children}
      <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">
        {label}
      </Text>
    </View>
  );
}

export function WorkoutMetrics({ session }: { session: WorkoutSession }) {
  const { colors } = useTheme();
  const level = getIntensity(session);

  return (
    <View className="mt-4 flex-row rounded-2xl bg-fg/5 py-3">
      <Column label="Durée">
        <Text numberOfLines={1} className="text-base font-bold text-fg">
          {session.durationMin} min
        </Text>
      </Column>
      <Column label="Dépense">
        <Text numberOfLines={1} className="text-base font-bold text-fg">
          {session.caloriesBurn} kcal
        </Text>
      </Column>
      <Column label="Niveau" last>
        <View className="h-6 flex-row items-center gap-0.5" accessibilityLabel={`Intensité ${level} sur 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Zap
              key={i}
              size={13}
              strokeWidth={2}
              color={i < level ? colors.fg : colors.muted}
              fill={i < level ? colors.fg : 'transparent'}
              opacity={i < level ? 1 : 0.35}
            />
          ))}
        </View>
      </Column>
    </View>
  );
}
