import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import {
  addDaysISO,
  formatFullDay,
  parseISODate,
  toISODate,
  weekDates,
  weekdayLabel,
} from '@/src/core/dates';
import { useTheme } from '@/src/ui/useTheme';

export function DateSelector() {
  const { colors } = useTheme();
  const selectedDate = usePulseFitStore((s) => s.selectedDate);
  const setSelectedDate = usePulseFitStore((s) => s.setSelectedDate);
  const meals = usePulseFitStore((s) => s.meals);

  const today = toISODate(new Date());
  const week = weekDates(parseISODate(selectedDate));
  const hasFutureWeek = week[6] >= today;
  const daysWithMeals = useMemo(
    () => new Set(meals.map((meal) => meal.loggedAt.slice(0, 10))),
    [meals],
  );
  const month = parseISODate(week[3]).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const shiftWeek = (delta: number) => {
    void Haptics.selectionAsync();
    const next = addDaysISO(selectedDate, delta * 7);
    setSelectedDate(next > today ? today : next);
  };

  return (
    <Card className="gap-2.5 px-3 pb-2.5 pt-3.5">
      <View className="flex-row items-center justify-between px-1.5">
        <Text className="text-[19px] font-semibold capitalize tracking-tight text-fg">{month}</Text>
        <View className="flex-row gap-2">
          <IconButton label="Semaine précédente" onPress={() => shiftWeek(-1)}>
            <ChevronLeft color={colors.fg} size={18} strokeWidth={2.2} />
          </IconButton>
          <IconButton label="Semaine suivante" onPress={() => shiftWeek(1)} disabled={hasFutureWeek}>
            <ChevronRight color={colors.fg} size={18} strokeWidth={2.2} />
          </IconButton>
        </View>
      </View>
      <View className="flex-row justify-between">
        {week.map((iso) => {
          const selected = iso === selectedDate;
          const future = iso > today;
          return (
            <Pressable
              key={iso}
              disabled={future}
              accessibilityRole="button"
              accessibilityLabel={formatFullDay(iso)}
              accessibilityState={{ selected }}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedDate(iso);
              }}
              className="w-11 items-center gap-1.5">
              <Text className="text-[13px] font-medium text-muted">{weekdayLabel(iso)}</Text>
              <View
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  selected ? 'bg-fg' : ''
                }`}>
                <Text
                  className={`text-[18px] font-semibold ${
                    selected ? 'text-canvas' : future ? 'text-muted' : 'text-fg'
                  }`}>
                  {Number(iso.slice(-2))}
                </Text>
              </View>
              <View
                className={`h-1.5 w-1.5 rounded-full ${
                  daysWithMeals.has(iso) && !selected ? 'bg-nutri' : 'bg-transparent'
                }`}
              />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
