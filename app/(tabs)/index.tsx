import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { MealTimeline } from '@/components/dashboard/MealTimeline';
import { NutritionWidget } from '@/components/dashboard/NutritionWidget';
import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useTodayStats } from '@/lib/store';

export default function HomeScreen() {
  const { profile, remaining, consumed, todaysSession, todaysMeals } = useTodayStats();
  const completeSession = usePulseFitStore((s) => s.completeSession);

  return (
    <Screen>
      <HomeHeader firstName={profile.firstName} />
      <NutritionWidget consumed={consumed} target={profile.macrosTarget} remaining={remaining} />
      <WorkoutWidget session={todaysSession} onComplete={completeSession} />
      <MealTimeline meals={todaysMeals} />
    </Screen>
  );
}
