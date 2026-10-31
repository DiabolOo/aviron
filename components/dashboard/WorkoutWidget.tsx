import { router } from 'expo-router';
import { Dumbbell, Hand, MoonStar } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Ripples } from '@/components/dashboard/Ripples';
import { getIntensity } from '@/components/sport/WorkoutCard';
import { Card } from '@/components/ui/Card';
import { HoldToConfirmCard } from '@/components/ui/HoldToConfirmCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Text } from '@/components/ui/Text';
import { useProposalStore } from '@/lib/proposalStore';
import { usePulseFitStore, useStreak, useTodayStats } from '@/lib/store';
import { getNowAction } from '@/src/core/now';
import { QuickAddSheet } from '@/components/dashboard/QuickAddSheet';
import type { WorkoutSession } from '@/src/core/types';
import { useTheme } from '@/src/ui/useTheme';

type WorkoutWidgetProps = {
  session?: WorkoutSession;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
};

function Stat({ value, unit, label, first }: { value: string; unit: string; label: string; first?: boolean }) {
  return (
    <View className={`flex-1 gap-0.5 ${first ? '' : 'border-l border-fg/10 pl-3.5'}`}>
      <Text className="text-[21px] font-bold text-fg">
        {value}
        <Text className="text-[15px] font-medium text-muted"> {unit}</Text>
      </Text>
      <Text className="text-[14px] text-muted">{label}</Text>
    </View>
  );
}

export function WorkoutWidget({ session, onComplete, onUndo }: WorkoutWidgetProps) {
  const { colors } = useTheme();
  const streak = useStreak();
  const ask = useProposalStore((s) => s.ask);
  const { todaysMeals } = useTodayStats();
  const dataReady = usePulseFitStore((s) => s.dataReady);
  const [adding, setAdding] = useState(false);

  if (!session || session.kind === 'rest') {
    const next = dataReady
      ? getNowAction({
          hour: new Date().getHours(),
          mealHours: todaysMeals.map((meal) => new Date(meal.loggedAt).getHours()),
        })
      : null;
    if (next?.kind === 'log_meal') {
      return (
        <Card tint="nutri" className="gap-4">
          <Text className="text-[16px] font-medium text-muted">À faire maintenant</Text>
          <Text className="text-[28px] font-bold leading-[32px] tracking-tight text-fg">
            Enregistrer le {next.title.toLowerCase()}
          </Text>
          <PrimaryButton label="Ajouter" onPress={() => setAdding(true)} />
          <QuickAddSheet visible={adding} onClose={() => setAdding(false)} />
        </Card>
      );
    }
    return (
      <Card className="flex-row items-center gap-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.sportTint }}>
          <MoonStar color={colors.sport} size={24} strokeWidth={1.9} />
        </View>
        <View className="flex-1">
          <Text className="text-[19px] font-semibold text-fg">Journée de repos</Text>
          <Text className="text-[15px] text-muted">Aucune séance prévue, récupère bien.</Text>
        </View>
      </Card>
    );
  }

  const postpone = () => {
    void ask('Décale ma séance, je suis claqué').then(() => router.navigate('/agent'));
  };

  return (
    <HoldToConfirmCard
      done={session.completed}
      onConfirm={() => onComplete(session.id)}
      onUndo={() => onUndo(session.id)}
      label="Valider la séance"
      doneTitle="Séance validée"
      doneSubtitle={streak > 0 ? `Série : ${streak} ${streak > 1 ? 'jours' : 'jour'}` : undefined}>
      <Ripples />
      <View className="flex-row items-center gap-3.5">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.sportTint }}>
          <Dumbbell color={colors.sport} size={24} strokeWidth={1.9} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[16px] font-medium text-muted">Séance du jour</Text>
          <Text numberOfLines={1} className="text-[28px] font-bold leading-[32px] tracking-tight text-fg">
            {session.title}
          </Text>
        </View>
      </View>
      <View className="flex-row py-1">
        <Stat first value={String(session.durationMin)} unit="min" label="Durée" />
        <Stat value={String(session.caloriesBurn)} unit="kcal" label="Dépense" />
        <Stat value={String(getIntensity(session))} unit="/ 5" label="Intensité" />
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Hand color={colors.muted} size={20} strokeWidth={1.9} />
          <Text className="text-[16px] font-medium text-muted">Maintiens pour valider</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reporter la séance"
          onPress={postpone}
          className="h-11 justify-center px-3.5 active:opacity-60">
          <Text className="text-[16px] font-medium text-muted underline">Reporter</Text>
        </Pressable>
      </View>
    </HoldToConfirmCard>
  );
}
