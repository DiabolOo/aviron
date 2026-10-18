import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, MoonStar } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Label } from '@/components/ui/Label';
import type { WorkoutSession } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type WorkoutWidgetProps = {
  session?: WorkoutSession;
  onComplete: (id: string) => void;
};

export function WorkoutWidget({ session, onComplete }: WorkoutWidgetProps) {
  const router = useRouter();
  const { colors } = useTheme();

  if (!session) {
    return (
      <View className="mt-10">
        <Label>Séance du jour</Label>
        <EmptyState
          className="mt-3"
          icon={MoonStar}
          title="Journée de repos préconisée"
          description="Aucune séance prévue — profite-en pour récupérer."
        />
      </View>
    );
  }

  const isCompleted = session.completed;

  return (
    <Pressable
      onPress={() => router.push(`/session/${session.id}`)}
      className={`mt-10 flex-row items-center rounded-3xl border bg-surface p-5 active:opacity-80 ${
        isCompleted ? 'border-accent/40' : 'border-fg/5'
      }`}>
      <View className="flex-1 pr-4">
        <Label>Séance du jour</Label>
        <Text className="mt-2 text-xl font-semibold tracking-tight text-fg">{session.title}</Text>
        <Text className="mt-1 text-sm text-muted">
          {session.durationMin} min · {session.caloriesBurn} kcal
          {isCompleted ? (
            <Text className="font-medium text-accent">{'  •  Séance pliée ! 💪'}</Text>
          ) : null}
        </Text>
      </View>
      {isCompleted ? (
        <DoneCheck color={colors.accentFg} />
      ) : (
        <IconButton
          variant="outline"
          label="Valider la séance"
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete(session.id);
          }}>
          <Check color={colors.muted} size={18} strokeWidth={2} />
        </IconButton>
      )}
    </Pressable>
  );
}

function DoneCheck({ color }: { color: string }) {
  const [scale] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View
      style={{ transform: [{ scale }] }}
      className="h-11 w-11 items-center justify-center rounded-full bg-accent">
      <Check color={color} size={18} strokeWidth={2.6} />
    </Animated.View>
  );
}
