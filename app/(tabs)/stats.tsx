import { router } from 'expo-router';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Gradient } from '@/components/ui/Gradient';
import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Text } from '@/components/ui/Text';
import type { StatsPeriod } from '@/src/core/stats';
import { MODULES } from '@/src/modules';
import { collectSections } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { Rise } from '@/src/ui/motion/Rise';
import { useStatsPeriod } from '@/src/ui/stats/period';
import { AI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

const PERIODS: { id: StatsPeriod; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

export default function StatsScreen() {
  const { colors } = useTheme();
  const isEnabled = useIsModuleEnabled();
  const period = useStatsPeriod((s) => s.period);
  const setPeriod = useStatsPeriod((s) => s.setPeriod);
  const cards = collectSections(MODULES, isEnabled, 'stats', ['sport', 'nutrition']);

  return (
    <Screen tone="plan">
      <View className="gap-3.5">
        <ScreenTitle title="Ma progression" subtitle="Où tu en es sur le mois et l’année" />
        <View className="flex-row gap-1">
          {PERIODS.map((item) => {
            const selected = item.id === period;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPeriod(item.id)}
                className={`h-11 justify-center rounded-full px-4 active:scale-95 ${
                  selected ? 'bg-fg' : ''
                }`}>
                <Text
                  className={`text-[15px] ${
                    selected ? 'font-semibold text-canvas' : 'font-medium text-muted'
                  }`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {cards.map((card, i) => (
          <Rise key={card.id} index={i}>
            <Fragment>
              <card.Component />
            </Fragment>
          </Rise>
        ))}

        <Rise index={cards.length}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Analyse de l’Agent"
            onPress={() => router.navigate('/agent')}
            className="active:opacity-80">
            <Card tint="ai" className="flex-row items-center gap-3.5 rounded-[24px] px-4 py-3.5">
              <Gradient
                colors={AI_GRADIENT}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles color="#FFFFFF" size={22} strokeWidth={2} />
              </Gradient>
              <View className="flex-1 gap-0.5">
                <Text className="text-[17px] font-semibold text-fg">Analyse de l’Agent</Text>
                <Text className="text-[14px] leading-[18px] text-muted">
                  Bientôt : constats et conseil, calculés à partir de tes tendances.
                </Text>
              </View>
              <ChevronRight color={colors.muted} size={20} strokeWidth={2} />
            </Card>
          </Pressable>
        </Rise>
      </View>
    </Screen>
  );
}
