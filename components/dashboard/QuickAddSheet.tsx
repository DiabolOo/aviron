import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Camera, History, MessageSquareText, Plus } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { addDaysISO, toISODate } from '@/src/core/dates';
import { mealsOfDayAt, usualMealsForHour } from '@/src/core/habits';
import { useTheme } from '@/src/ui/useTheme';

type QuickAddSheetProps = { visible: boolean; onClose: () => void };

function Row({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      className="min-h-14 flex-row items-center gap-3 border-t border-fg/10 py-3 active:opacity-60">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-chip">{icon}</View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[17px] font-medium text-fg">
          {title}
        </Text>
        {hint ? <Text className="text-[14px] text-muted">{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function QuickAddSheet({ visible, onClose }: QuickAddSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meals = usePulseFitStore((s) => s.meals);
  const addMeal = usePulseFitStore((s) => s.addMeal);
  const now = new Date();
  const today = toISODate(now);
  const usual = usualMealsForHour(meals, now.getHours());
  const yesterday = mealsOfDayAt(meals, addDaysISO(today, -1));

  const logMeal = (name: string, macros: (typeof meals)[number]['macros']) => {
    const time = now.toTimeString().slice(0, 8);
    addMeal({ name, macros, loggedAt: `${today}T${time}`, confidence: 1 });
    onClose();
  };

  const go = (path: '/scan' | '/agent') => {
    onClose();
    router.push(path);
  };

  const icon = (Icon: typeof Camera) => <Icon color={colors.fg} size={18} strokeWidth={1.9} />;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} accessibilityLabel="Fermer" />
      <View
        className="rounded-t-[32px] bg-canvas px-5 pt-5"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        <Text className="mb-2 text-[21px] font-bold text-fg">Ajouter un repas</Text>
        {usual.map((meal) => (
          <Row
            key={meal.name}
            icon={icon(Plus)}
            title={meal.name}
            hint={`${Math.round(meal.macros.calories)} kcal · repas habituel`}
            onPress={() => logMeal(meal.name, meal.macros)}
          />
        ))}
        {yesterday.length > 0 ? (
          <Row
            icon={icon(History)}
            title="Comme hier"
            hint={`${yesterday.length} ${yesterday.length > 1 ? 'repas' : 'repas'} recopiés`}
            onPress={() => {
              yesterday.forEach((meal) =>
                addMeal({
                  name: meal.name,
                  macros: meal.macros,
                  loggedAt: `${today}T${meal.loggedAt.split('T')[1] ?? '12:00:00'}`,
                  confidence: 1,
                }),
              );
              onClose();
            }}
          />
        ) : null}
        <Row icon={icon(Camera)} title="Photo de l’assiette" onPress={() => go('/scan')} />
        <Row icon={icon(MessageSquareText)} title="Décrire avec une phrase" onPress={() => go('/agent')} />
      </View>
    </Modal>
  );
}
