import { CalorieGauge } from '@/components/dashboard/CalorieGauge';
import { DayStatus } from '@/components/dashboard/DayStatus';
import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { WorkoutWidget } from '@/components/dashboard/WorkoutWidget';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useTodayStats } from '@/lib/store';

export default function TodayScreen() {
  const { profile, remaining, consumed, burned, todaysSession } = useTodayStats();
  const completeSession = usePulseFitStore((s) => s.completeSession);
  const weather = usePulseFitStore((s) => s.weather);

  return (
    <Screen>
      <HomeHeader firstName={profile.firstName} />
      <DayStatus weather={weather} session={todaysSession} />
      <CalorieGauge
        consumed={consumed.calories}
        burned={burned}
        target={profile.calorieTarget}
        remaining={remaining}
      />
      <WorkoutWidget session={todaysSession} onComplete={completeSession} />
    </Screen>
  );
}
