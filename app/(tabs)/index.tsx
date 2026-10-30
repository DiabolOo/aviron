import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useStreak, useTodayStats } from '@/lib/store';
import { MODULES } from '@/src/modules';
import { isModuleEnabled } from '@/src/modules/flags';
import { collectTodayWidgets } from '@/src/modules/registry';

export default function TodayScreen() {
  const { profile, todaysSession } = useTodayStats();
  const weather = usePulseFitStore((s) => s.weather);
  const streak = useStreak();
  const widgets = collectTodayWidgets(MODULES, isModuleEnabled);

  return (
    <Screen>
      <HomeHeader
        firstName={profile.firstName}
        streak={streak}
        weather={weather}
        session={todaysSession}
      />
      {widgets.map((widget) => (
        <widget.Component key={widget.id} />
      ))}
    </Screen>
  );
}
