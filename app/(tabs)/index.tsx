import { DayStatus } from '@/components/dashboard/DayStatus';
import { EnergyBatteryWidget } from '@/components/dashboard/EnergyBatteryWidget';
import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { MealTimeline } from '@/components/dashboard/MealTimeline';
import { NutritionWidget } from '@/components/dashboard/NutritionWidget';
import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useStreak, useTodayStats } from '@/lib/store';

export default function TodayScreen() {
  const { profile, remaining, consumed, todaysMeals, todaysSession } = useTodayStats();
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const weather = usePulseFitStore((s) => s.weather);
  const streak = useStreak();

  return (
    <Screen>
      <HomeHeader firstName={profile.firstName} streak={streak} weather={weather} />
      <DayStatus session={todaysSession} />
      <NutritionWidget consumed={consumed} target={profile.macrosTarget} remaining={remaining} />
      <EnergyBatteryWidget
        session={todaysSession}
        consumedKcal={consumed.calories}
        targetKcal={profile.macrosTarget.calories}
      />
      <WorkoutWidget session={todaysSession} onComplete={completeSession} />
      <MealTimeline meals={todaysMeals} />
    </Screen>
  );
}
