/**
 * Semaine passée (`109`) — empilée dans l'onglet Semaine.
 *
 * Affiche les 7 jours de la semaine choisie avec DayDots, un EmptyState si rien
 * d'importé, et un CoachCard d'insight.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { usePulseFitStore } from '@/lib/store';
import { addDaysISO, parseISODate } from '@/src/core/dates';
import { selectWeek } from '@/src/core/sportWeek';
import { NBSP } from '@/src/core/sportFormat';
import { makeStyles, useTheme } from '@/src/design';
import { BackHeader } from '@/src/ui/BackHeader';
import { CoachCard } from '@/src/ui/CoachCard';
import { DayDots, type DayDot } from '@/src/ui/DayDots';
import { EmptyState } from '@/src/ui/EmptyState';
import { Text } from '@/src/ui/Text';
import { useTabBarInset } from '@/src/ui/useTabBarInset';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** « 26 oct. – 1 nov. » */
function formatPeriod(startISO: string, endISO: string): string {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString('fr-FR', { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) });
  const endLabel = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${startLabel}${NBSP}–${NBSP}${endLabel}`;
}

/** Initiale du jour (L, M, M, J, V, S, D). */
const DAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: t.space.screen, gap: t.space.section },
  header: { paddingTop: t.space.lg },
  meta: { gap: t.space.xs },
  dots: { paddingVertical: t.space.md },
}));

// ─── Screen ─────────────────────────────────────────────────────────────────

export function PastWeekScreen() {
  const { start } = useLocalSearchParams<{ start: string }>();
  const styles = useStyles();
  const { space } = useTheme();
  const tabBarInset = useTabBarInset();

  const activities = usePulseFitStore((s) => s.activities);

  const week = useMemo(() => selectWeek(activities, start), [activities, start]);

  const periodLabel = formatPeriod(week.start, week.end);

  // ── DayDots ──
  const dayDots: DayDot[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDaysISO(week.start, i);
      const hasActivity = week.activities.some((a) => a.date === iso);
      const d = parseISODate(iso);
      return {
        id: iso,
        label: DAY_INITIALS[i],
        date: `${d.getDate()}`,
        state: hasActivity ? 'done' : 'empty',
      };
    });
  }, [week]);

  const isEmpty = week.count === 0;

  return (
    <View style={styles.root} testID="past-week-screen">
      <View style={styles.header}>
        <BackHeader label="Cette semaine" onBack={() => router.back()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + space.section }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Surtitre + titre ── */}
        <View style={styles.meta}>
          <Text role="sub" weight="semibold" color="inkSecondary">
            Semaine passée
          </Text>
          <Text role="title">{periodLabel}</Text>
        </View>

        {/* ── Cercles jour ── */}
        <View style={styles.dots}>
          <DayDots days={dayDots} />
        </View>

        {/* ── Contenu ou EmptyState ── */}
        {isEmpty ? (
          <EmptyState
            reason="noImport"
            title="Rien d’importé cette semaine."
            body="Soit tu as fait une pause, soit tu as couru sans rien enregistrer. Les deux arrivent, et je ne les traite pas pareil."
            primary={{ label: 'J’ai couru sans montre', onPress: () => router.push('/(tabs)/coach') }}
            secondary={{ label: 'C’était une pause', onPress: () => router.back() }}
            caption="«\u00a0Sans montre\u00a0» ouvre le coach\u00a0: dis «\u00a030\u00a0minutes samedi\u00a0» et c’est noté."
          />
        ) : null}

        {/* ── Coach card ── */}
        <CoachCard
          kind="insight"
          verdict={isEmpty
            ? 'Je ne change rien à ton plan pour l’instant.'
            : `${week.count}${NBSP}${week.count > 1 ? 'sorties' : 'sortie'} cette semaine.`}
          body={isEmpty
            ? 'La séance de lundi est déjà un footing facile. Ta réponse m’aide à doser la sortie longue de samedi.'
            : undefined}
          source="device"
        />
      </ScrollView>
    </View>
  );
}
