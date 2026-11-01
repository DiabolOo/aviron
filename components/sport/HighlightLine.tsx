import { Flame, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { nbspUnits } from '@/src/core/sportFormat';
import type { Highlight } from '@/src/core/training/highlights';
import { FadeSlide } from '@/src/ui/motion/FadeSlide';
import { FLAME_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type Props = {
  highlight: Highlight;
  /** faux quand la valeur est déjà affichée dans les chiffres clés : on ne la répète pas */
  showValue?: boolean;
};

/**
 * Moment fort : une ligne avec icône sous les chiffres clés, sans carte. Le texte passe à la ligne plutôt
 * que d'être tronqué. La flamme orange est réservée aux candidats « plus rapide » et « plus longue ».
 */
export function HighlightLine({ highlight, showValue = true }: Props) {
  const { colors } = useTheme();
  const flame = highlight.tone === 'flame';
  const Icon = flame ? Flame : Sparkles;

  return (
    <FadeSlide className="mt-6">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5">
          <Icon color={flame ? FLAME_GRADIENT[0] : colors.accent} size={22} strokeWidth={2} />
        </View>
        <Text testID="highlight-title" className="flex-1 text-lg text-fg">
          {nbspUnits(highlight.title)}
          {showValue && highlight.value ? (
            <Text testID="highlight-value" className="font-semibold">{` · ${nbspUnits(highlight.value)}`}</Text>
          ) : null}
        </Text>
      </View>
    </FadeSlide>
  );
}
