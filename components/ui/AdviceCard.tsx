import { BarChart3, ChevronDown, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { nbspUnits } from '@/src/core/sportFormat';
import { FadeSlide } from '@/src/ui/motion/FadeSlide';
import { useTheme } from '@/src/ui/useTheme';

export type AdviceSource = 'data' | 'ai';

type Props = {
  title: string;
  /** une phrase avec le chiffre clé */
  summary: string;
  /** paragraphes du bloc « Pourquoi ? » (replié par défaut) */
  why?: string[];
  /** `data` : calculé sur les données de l'utilisateur ; `ai` : produit par l'IA */
  source: AdviceSource;
};

const LABELS: Record<AdviceSource, string> = { data: 'D’après tes données', ai: 'Analyse IA' };

/** Interligne 1,45 sur le texte des conseils. */
const body = (fontSize: number) => ({ fontSize, lineHeight: Math.round(fontSize * 1.45 * 100) / 100 });

/**
 * Carte de conseil : étiquette de provenance, titre, une phrase avec le chiffre clé, puis « Pourquoi ? »
 * replié. Teinte bleu ardoise pour les données (distincte de Nutrition et Forme), violette pour l'IA.
 */
export function AdviceCard({ title, summary, why = [], source }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const ai = source === 'ai';
  const accent = ai ? colors.insightAi : colors.insightData;
  const Icon = ai ? Sparkles : BarChart3;

  return (
    <View
      testID={`advice-card-${source}`}
      className="rounded-3xl p-5"
      style={{ backgroundColor: ai ? colors.insightAiTint : colors.insightDataTint, borderWidth: 1, borderColor: `${accent}33` }}>
      <View className="flex-row items-center gap-2">
        <Icon color={accent} size={16} strokeWidth={2} />
        <Text testID="advice-source" className="text-xs font-semibold" style={{ color: accent }}>
          {LABELS[source]}
        </Text>
      </View>
      <Text className="mt-3 text-base font-semibold text-fg" style={body(17)}>
        {nbspUnits(title)}
      </Text>
      <Text testID="advice-summary" className="mt-1 text-fg" style={body(15)}>
        {nbspUnits(summary)}
      </Text>

      {why.length > 0 ? (
        <View className="mt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            hitSlop={8}
            onPress={() => setOpen((v) => !v)}
            className="flex-row items-center gap-1 self-start py-1 active:opacity-70">
            <Text className="text-sm font-semibold" style={{ color: accent }}>
              Pourquoi ?
            </Text>
            <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <ChevronDown color={accent} size={16} strokeWidth={2.2} />
            </View>
          </Pressable>
          {open ? (
            <View testID="advice-why">
              <FadeSlide delayMs={0} className="mt-2 gap-2">
                {why.map((line) => (
                  <Text key={line} className="text-fg" style={body(15)}>
                    {nbspUnits(line)}
                  </Text>
                ))}
              </FadeSlide>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
