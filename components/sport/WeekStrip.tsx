import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { toISODate, weekdayLabel } from '@/lib/dates';
import type { WorkoutSession } from '@/lib/types';

type WeekStripProps = {
  sessions: WorkoutSession[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function WeekStrip({ sessions, selectedDate, onSelect }: WeekStripProps) {
  const today = toISODate(new Date());

  return (
    <View className="mt-8 flex-row justify-between">
      {sessions.map((session) => {
        const selected = session.date === selectedDate;
        const isToday = session.date === today;
        return (
          <Pressable
            key={session.date}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(session.date);
            }}
            className={`h-[76px] w-11 items-center justify-center rounded-full ${
              selected ? 'bg-fg' : isToday ? 'border border-fg/15' : ''
            }`}>
            <Text className={`font-mono text-[10px] uppercase ${selected ? 'text-canvas' : 'text-muted'}`}>
              {weekdayLabel(session.date)}
            </Text>
            <Text className={`mt-1 text-base font-semibold ${selected ? 'text-canvas' : 'text-fg'}`}>
              {session.date.slice(-2)}
            </Text>
            <View
              className={`mt-1.5 h-1 w-1 rounded-full ${session.completed ? 'bg-accent' : 'bg-transparent'}`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
