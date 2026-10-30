import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowRight, Footprints, Sparkles, UtensilsCrossed } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Label } from '@/components/ui/Label';
import { usePulseFitStore, useTodayStats } from '@/lib/store';
import { getNowAction } from '@/src/core/now';
import { useTheme } from '@/src/ui/useTheme';

export function NowCard() {
  const { colors } = useTheme();
  const { todaysMeals, todaysSession } = useTodayStats();
  const hydrated = usePulseFitStore((s) => s.dataReady);
  const now = new Date();

  if (!hydrated) return null;

  const action = getNowAction({
    hour: now.getHours(),
    mealHours: todaysMeals.map((meal) => new Date(meal.loggedAt).getHours()),
    session: todaysSession,
  });

  const content = {
    log_meal: {
      Icon: UtensilsCrossed,
      label: 'Maintenant',
      subtitle: 'Scanne ton assiette en une photo',
      onPress: () => router.push('/scan'),
    },
    workout: {
      Icon: Footprints,
      label: 'Maintenant',
      subtitle: 'Ta séance du jour t’attend',
      onPress: () => todaysSession && router.push(`/session/${todaysSession.id}`),
    },
    idle: {
      Icon: Sparkles,
      label: 'Maintenant',
      subtitle: 'Dis à l’agent ce dont tu as besoin',
      onPress: () => router.navigate('/agent'),
    },
  }[action.kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${action.title}. ${content.subtitle}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        content.onPress();
      }}
      className="mb-2 flex-row items-center gap-4 rounded-4xl border-b-4 border-black/25 bg-accent p-5 active:translate-y-1 active:border-b-0 active:opacity-90">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-accent-fg">
        <content.Icon color={colors.accent} size={24} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Label className="text-accent-fg/70">{content.label}</Label>
        <Text className="mt-1 text-xl font-semibold tracking-tight text-accent-fg">
          {action.title}
        </Text>
        <Text className="mt-0.5 text-sm font-medium text-accent-fg/75">{content.subtitle}</Text>
      </View>
      <ArrowRight color={colors.accentFg} size={20} strokeWidth={2.2} />
    </Pressable>
  );
}
