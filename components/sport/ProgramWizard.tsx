import * as Haptics from 'expo-haptics';
import { Mic, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { type InputRef, Text, TextInput } from '@/components/ui/Text';
import { usePulseFitStore } from '@/lib/store';
import { toISODate } from '@/src/core/dates';
import { OBJECTIVE_MODELS, parseObjective } from '@/src/core/objective';
import { useTheme } from '@/src/ui/useTheme';

const GENERATION_MESSAGES = ['Analyse de ton objectif…', 'Construction des semaines…', 'Placement des jalons…'];

export function ProgramWizard() {
  const { colors } = useTheme();
  const activities = usePulseFitStore((s) => s.activities);
  const setAthleticGoal = usePulseFitStore((s) => s.setAthleticGoal);
  const generateWorkoutProgram = usePulseFitStore((s) => s.generateWorkoutProgram);
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const input = useRef<InputRef>(null);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(
      () => setMessageIndex((i) => Math.min(i + 1, GENERATION_MESSAGES.length - 1)),
      700,
    );
    const timeout = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      generateWorkoutProgram();
    }, 2300);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [generating, generateWorkoutProgram]);

  const today = toISODate(new Date());
  const goal = parseObjective(text, today);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recent = activities.filter((a) => a.date.slice(0, 10) >= toISODate(weekAgo));
  const km = recent.reduce((sum, a) => sum + a.distanceKm, 0);

  const submit = () => {
    if (!goal) return;
    setAthleticGoal(goal);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessageIndex(0);
    setGenerating(true);
  };

  if (generating) {
    return (
      <Card tint="sport" className="items-center gap-4 py-12">
        <ActivityIndicator color={colors.accent} size="large" />
        <Text className="text-[17px] font-semibold text-fg">{GENERATION_MESSAGES[messageIndex]}</Text>
      </Card>
    );
  }

  return (
    <View className="gap-3.5">
      <Card tint="sport" className="gap-3.5">
        <Text className="text-[16px] font-medium text-muted">Ton objectif</Text>
        <TextInput
          ref={input}
          value={text}
          onChangeText={setText}
          multiline
          accessibilityLabel="Décris ton objectif"
          placeholder="Ex. Semi en 1 h 45 dans 10 semaines, 4 séances par semaine, pas le mercredi"
          placeholderTextColor={colors.muted}
          className="h-24 p-0 text-[20px] font-medium leading-[27px] text-fg"
          textAlignVertical="top"
        />
        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dicter"
            onPress={() => input.current?.focus()}
            className="h-[52px] w-[52px] items-center justify-center rounded-full bg-chip active:scale-95">
            <Mic color={colors.fg} size={22} strokeWidth={1.9} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Créer mon plan"
            disabled={!goal}
            onPress={submit}
            className={`h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-fg active:scale-95 ${
              goal ? '' : 'opacity-40'
            }`}>
            <Sparkles color={colors.canvas} size={20} strokeWidth={2} />
            <Text className="text-[18px] font-semibold text-canvas">Créer mon plan</Text>
          </Pressable>
        </View>
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
                setText(model.text);
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
