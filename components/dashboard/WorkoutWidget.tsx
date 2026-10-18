import { useRouter } from 'expo-router';
import { Check, MoonStar } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

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

  return (
    <Pressable
      onPress={() => router.push(`/session/${session.id}`)}
      className="mt-10 flex-row items-center rounded-3xl border border-fg/5 bg-surface p-5 active:opacity-80">
      <View className="flex-1 pr-4">
        <Label>Séance du jour</Label>
        <Text className="mt-2 text-xl font-semibold tracking-tight text-fg">{session.title}</Text>
        <Text className="mt-1 text-sm text-muted">
          {session.durationMin} min · {session.caloriesBurn} kcal
        </Text>
      </View>
      {session.completed ? (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
          <Check color={colors.accentFg} size={18} strokeWidth={2.6} />
        </View>
      ) : (
        <IconButton variant="outline" label="Valider la séance" onPress={() => onComplete(session.id)}>
          <Check color={colors.muted} size={18} strokeWidth={2} />
        </IconButton>
      )}
    </Pressable>
  );
}
