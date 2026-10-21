import * as Haptics from 'expo-haptics';
import { Flag, Pencil, RotateCcw } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { formatDayMonth, toISODate } from '@/lib/dates';
import type { WorkoutProgram } from '@/lib/types';
import { useTheme } from '@/lib/useTheme';

type ProgramTimelineProps = {
  program: WorkoutProgram;
  onEdit: () => void;
  onReset: () => void;
};

export function ProgramTimeline({ program, onEdit, onReset }: ProgramTimelineProps) {
  const { colors } = useTheme();
  const today = toISODate(new Date());
  const { goal } = program;

  return (
    <View className="mt-8 gap-4">
      <Card className="gap-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-1 pr-3">
            <Label>Objectif</Label>
            <Text className="text-xl font-semibold tracking-tight text-fg">{goal.targetName}</Text>
            <Text className="text-sm text-muted">
              {[goal.targetValue, `${goal.weeklySessionsCount} séances / sem.`, `${program.totalWeeks} sem.`]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityLabel="Modifier l’objectif"
              onPress={() => {
                void Haptics.selectionAsync();
                onEdit();
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-fg/5 active:opacity-60">
              <Pencil color={colors.fg} size={15} strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityLabel="Réinitialiser l’objectif"
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onReset();
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-fg/5 active:opacity-60">
              <RotateCcw color={colors.fg} size={15} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <View className="border-t border-fg/5 pt-4">
          {program.milestones.map((milestone, index) => {
            const passed = milestone.date < today;
            const last = index === program.milestones.length - 1;
            return (
              <View key={milestone.id} className="flex-row items-center gap-3 py-2">
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${
                    last ? 'bg-accent' : passed ? 'bg-fg' : 'bg-fg/10'
                  }`}>
                  {last ? <Flag color={colors.accentFg} size={12} strokeWidth={2} /> : null}
                </View>
                <View className="flex-1">
                  <Text className={`text-base ${passed ? 'text-muted' : 'font-semibold text-fg'}`}>
                    {milestone.title}
                  </Text>
                </View>
                <Text className="text-sm text-muted">{formatDayMonth(milestone.date)}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
