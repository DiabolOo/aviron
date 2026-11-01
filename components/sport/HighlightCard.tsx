import { Flame, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Highlight } from '@/src/core/training/highlights';
import { FadeSlide } from '@/src/ui/motion/FadeSlide';
import { FLAME_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

/** Moment fort de l'activité. La flamme orange est réservée aux candidats « plus rapide » et « plus longue ». */
export function HighlightCard({ highlight }: { highlight: Highlight }) {
  const { colors } = useTheme();
  const flame = highlight.tone === 'flame';
  const Icon = flame ? Flame : Sparkles;

  return (
    <FadeSlide className="mt-6">
      <Card>
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-fg/5">
            <Icon color={flame ? FLAME_GRADIENT[0] : colors.accent} size={20} strokeWidth={2} />
          </View>
          <Text testID="highlight-title" className="flex-1 text-lg font-semibold text-fg">
            {highlight.title}
          </Text>
        </View>
        <Text testID="highlight-value" className="mt-4 text-5xl font-semibold tracking-tight text-fg">
          {highlight.value}
        </Text>
        <Text className="mt-2 text-base text-muted">{highlight.detail}</Text>
      </Card>
    </FadeSlide>
  );
}
