import { Flag, Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatDayMonth, toISODate } from '@/src/core/dates';
import type { WorkoutProgram } from '@/src/core/types';
import { openAgent } from '@/src/ui/agentDraft';
import { useTheme } from '@/src/ui/useTheme';

const DAY_MS = 86_400_000;

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / DAY_MS);
}

export function ProgramTimeline({ program }: { program: WorkoutProgram }) {
  const { colors } = useTheme();
  const today = toISODate(new Date());
  const { goal } = program;
  const total = Math.max(1, daysBetween(program.startDate, program.endDate));
  const left = Math.max(0, daysBetween(today, program.endDate));
  const progress = Math.min(1, Math.max(0, daysBetween(program.startDate, today) / total));

  return (
    <Card tint="sport" className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-[16px] font-medium text-muted">Ton objectif</Text>
          <Text className="text-[22px] font-semibold tracking-tight text-fg">
            {[goal.targetName, goal.targetValue].filter(Boolean).join(' en ')}
          </Text>
          <Text className="text-[15px] text-muted">
            {`${goal.weeklySessionsCount} séances / sem. · ${program.totalWeeks} sem.`}
          </Text>
        </View>
        <Text className="text-[22px] font-bold text-sport">J-{left}</Text>
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-fg/10">
        <View className="h-full rounded-full bg-sport" style={{ width: `${Math.round(progress * 100)}%` }} />
      </View>

      <View className="border-t border-fg/10 pt-2">
        {program.milestones.map((milestone, index) => {
          const passed = milestone.date < today;
          const last = index === program.milestones.length - 1;
          return (
            <View key={milestone.id} className="flex-row items-center gap-3 py-2">
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${
                  last ? 'bg-sport' : passed ? 'bg-fg' : 'bg-fg/10'
                }`}>
                {last ? <Flag color="#FFFFFF" size={12} strokeWidth={2} /> : null}
              </View>
              <Text className={`flex-1 text-[16px] ${passed ? 'text-muted' : 'font-semibold text-fg'}`}>
                {milestone.title}
              </Text>
              <Text className="text-[15px] text-muted">{formatDayMonth(milestone.date)}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Modifier avec l’Agent"
        onPress={() => openAgent('', `Plan · ${goal.targetName}`)}
        className="h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-fg active:scale-95">
        <Sparkles color={colors.canvas} size={20} strokeWidth={2} />
        <Text className="text-[18px] font-semibold text-canvas">Modifier avec l’Agent</Text>
      </Pressable>
    </Card>
  );
}
