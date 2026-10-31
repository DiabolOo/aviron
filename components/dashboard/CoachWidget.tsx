import { router } from 'expo-router';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Gradient } from '@/components/ui/Gradient';
import { Text } from '@/components/ui/Text';
import { useProposalStore } from '@/lib/proposalStore';
import { AI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

const TOPIC: Record<string, string> = {
  adjust_plan: 'séance',
  log_meal: 'repas',
  adjust_nutrition_targets: 'objectif nutrition',
};

export function CoachWidget() {
  const { colors } = useTheme();
  const proposals = useProposalStore((s) => s.proposals);
  const pending = proposals.filter((p) => p.status === 'pending');

  if (pending.length === 0) return null;

  const topics = [...new Set(pending.map((p) => TOPIC[p.action] ?? 'action'))].join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pending.length} propositions du coach`}
      onPress={() => router.navigate('/agent')}
      className="active:opacity-80">
      <Card tint="ai" className="flex-row items-center gap-3.5 rounded-[24px] px-4 py-3.5">
        <Gradient
          colors={AI_GRADIENT}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles color="#FFFFFF" size={22} strokeWidth={2} />
        </Gradient>
        <View className="flex-1 gap-0.5">
          <Text className="text-[18px] font-semibold text-fg">
            {pending.length} {pending.length > 1 ? 'propositions' : 'proposition'} du coach
          </Text>
          <Text numberOfLines={1} className="text-[15px] text-muted">
            À valider : {topics}
          </Text>
        </View>
        <ChevronRight color={colors.muted} size={20} strokeWidth={2} />
      </Card>
    </Pressable>
  );
}
