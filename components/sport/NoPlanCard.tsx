import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { OBJECTIVE_MODELS } from '@/src/core/objective';
import { openAgent } from '@/src/ui/agentDraft';
import { useTheme } from '@/src/ui/useTheme';

const CONTEXT = 'Plan · Sport';

export function NoPlanCard() {
  const { colors } = useTheme();
  const activities = usePulseFitStore((s) => s.activities);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = activities.filter((a) => a.date.slice(0, 10) >= toISODate(weekAgo));
  const km = recent.reduce((sum, a) => sum + a.distanceKm, 0);

  return (
    <View className="gap-3.5">
      <Card tint="sport" className="gap-3.5">
        <View className="gap-1">
          <Text className="text-[20px] font-semibold text-fg">Pas encore de plan</Text>
          <Text className="text-[16px] text-muted">Dis ton objectif à l’Agent, il construit la semaine.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Créer mon plan avec l’Agent"
          onPress={() => openAgent('', CONTEXT)}
          className="h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-fg active:scale-95">
          <Sparkles color={colors.canvas} size={20} strokeWidth={2} />
          <Text className="text-[18px] font-semibold text-canvas">Créer mon plan avec l’Agent</Text>
        </Pressable>
      </Card>

      <View className="gap-2.5">
        <Text className="text-[16px] font-medium text-muted">Ou pars d’un modèle</Text>
        <View className="flex-row flex-wrap gap-2">
          {OBJECTIVE_MODELS.map((model) => (
            <Pressable
              key={model.label}
              accessibilityRole="button"
              onPress={() => {
                void Haptics.selectionAsync();
                openAgent(model.text, CONTEXT);
              }}
              className="h-11 justify-center rounded-full border border-fg/10 bg-surface px-4 active:scale-95">
              <Text className="text-[16px] font-medium text-fg">{model.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text className="px-1 text-[15px] text-muted">
        {recent.length > 0
          ? `Basé sur tes 7 derniers jours : ${km.toFixed(1).replace('.', ',')} km et ${recent.length} ${
              recent.length > 1 ? 'séances' : 'séance'
            }.`
          : 'Aucune activité sur les 7 derniers jours : le plan démarrera en douceur.'}
      </Text>
    </View>
  );
}
