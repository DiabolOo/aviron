import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import {
  formatFullDay,
  parseISODate,
  relativeDayLabel,
  toISODate,
  weekDates,
  weekdayLabel,
} from '@/lib/dates';
import { usePulseFitStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';

export function DateSelector() {
  const { colors } = useTheme();
  const selectedDate = usePulseFitStore((s) => s.selectedDate);
  const setSelectedDate = usePulseFitStore((s) => s.setSelectedDate);
  const goToPreviousDay = usePulseFitStore((s) => s.goToPreviousDay);
  const goToNextDay = usePulseFitStore((s) => s.goToNextDay);
  const goToToday = usePulseFitStore((s) => s.goToToday);
  const meals = usePulseFitStore((s) => s.meals);

  const today = toISODate(new Date());
  const isToday = selectedDate === today;
  const week = weekDates(parseISODate(selectedDate));
  const daysWithMeals = useMemo(
    () => new Set(meals.map((meal) => meal.loggedAt.slice(0, 10))),
    [meals],
  );

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between">
        <IconButton label="Jour précédent" onPress={goToPreviousDay}>
          <ChevronLeft color={colors.fg} size={18} strokeWidth={1.8} />
        </IconButton>

        <View className="items-center">
          <Text className="text-base font-semibold text-fg">{relativeDayLabel(selectedDate)}</Text>
          {isToday ? (
            <Text className="mt-1 font-mono text-[10px] uppercase tracking-[1px] text-muted">
              {formatFullDay(selectedDate)}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revenir à aujourd’hui"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                goToToday();
              }}
              className="mt-1.5 rounded-full bg-fg/5 px-3 py-1 active:opacity-70">
              <Text className="font-mono text-[10px] uppercase tracking-[1px] text-fg">
                Aujourd’hui
              </Text>
            </Pressable>
          )}
        </View>

        <IconButton label="Jour suivant" onPress={goToNextDay} disabled={isToday}>
          <ChevronRight color={colors.fg} size={18} strokeWidth={1.8} />
        </IconButton>
      </View>

      <View className="mt-4 flex-row justify-between">
        {week.map((iso) => {
          const selected = iso === selectedDate;
          const isTodayCell = iso === today;
          const future = iso > today;
          return (
            <Pressable
              key={iso}
              disabled={future}
              accessibilityRole="button"
              accessibilityLabel={formatFullDay(iso)}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedDate(iso);
              }}
              className={`h-[76px] w-11 items-center justify-center rounded-full ${
                selected ? 'bg-fg' : isTodayCell ? 'border border-fg/15' : ''
              } ${future ? 'opacity-30' : ''}`}>
              <Text
                className={`font-mono text-[10px] uppercase ${selected ? 'text-canvas' : 'text-muted'}`}>
                {weekdayLabel(iso)}
              </Text>
              <Text
                className={`mt-1 text-base font-semibold ${selected ? 'text-canvas' : 'text-fg'}`}>
                {iso.slice(-2)}
              </Text>
              <View
                className={`mt-1.5 h-1 w-1 rounded-full ${
                  daysWithMeals.has(iso) ? 'bg-accent' : 'bg-transparent'
                }`}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
