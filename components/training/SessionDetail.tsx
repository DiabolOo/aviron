import { Check } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { WorkoutKind, WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type SessionDetailProps = {
  session: WorkoutSession;
  onComplete?: (id: string) => void;
};

const KIND_LABEL: Record<WorkoutKind, string> = {
  run: 'Running',
  strength: 'Musculation',
  rest: 'Récupération',
};

function Metric({ value, unit }: { value: number; unit: string }) {
  return (
    <Text className="text-2xl font-semibold tracking-tight text-fg">
      {value}
      <Text className="text-sm font-normal text-muted"> {unit}</Text>
    </Text>
  );
}

function Row({ index, children }: { index: number; children: ReactNode }) {
  return (
    <View className={`flex-row items-center py-3.5 ${index > 0 ? 'border-t border-fg/5' : ''}`}>
      {children}
    </View>
  );
}

export function SessionDetail({ session, onComplete }: SessionDetailProps) {
  const { colors } = useTheme();

  return (
    <Card className="mt-6">
      <Label>{KIND_LABEL[session.kind]}</Label>
      <Text className="mt-2 text-2xl font-semibold tracking-tight text-fg">{session.title}</Text>
      <Text className="mt-1 text-sm text-muted">{session.subtitle}</Text>

      <View className="mt-5 flex-row gap-8">
        <Metric value={session.durationMin} unit="min" />
        <Metric value={session.caloriesBurn} unit="kcal" />
      </View>

      <View className="mt-4">
        {session.blocks?.map((block, index) => (
          <Row key={block.id} index={index}>
            <Text className="w-8 font-mono text-xs text-muted">
              {`${index + 1}`.padStart(2, '0')}
            </Text>
            <View className="flex-1 pr-3">
              <Text className="text-base text-fg">{block.title}</Text>
              <Text className="mt-0.5 text-sm text-muted">{block.detail}</Text>
            </View>
            {block.durationMin ? (
              <Text className="font-mono text-xs text-muted">{block.durationMin}′</Text>
            ) : null}
          </Row>
        ))}
        {session.exercises?.map((exercise, index) => (
          <Row key={exercise.id} index={index}>
            <View className="flex-1 pr-3">
              <Text className="text-base text-fg">{exercise.name}</Text>
              <Text className="mt-0.5 text-sm text-muted">Repos {exercise.restSec} s</Text>
            </View>
            <Text className="font-semibold text-fg">
              {exercise.sets} × {exercise.reps}
            </Text>
          </Row>
        ))}
      </View>

      {session.completed ? (
        <View className="mt-4 flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-accent">
            <Check color={colors.accentFg} size={12} strokeWidth={3} />
          </View>
          <Text className="text-sm text-muted">Séance terminée</Text>
        </View>
      ) : onComplete ? (
        <View className="mt-5">
          <PrimaryButton label="Marquer comme faite" onPress={() => onComplete(session.id)} />
        </View>
      ) : null}
    </Card>
  );
}
