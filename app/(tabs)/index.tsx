import { Fragment } from 'react';
import { View } from 'react-native';

import { HomeHeader } from '@/components/dashboard/HomeHeader';
import { Screen } from '@/components/ui/Screen';
import { usePulseFitStore, useStreak } from '@/lib/store';
import { CORE_TODAY_WIDGETS, MODULES } from '@/src/modules';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { collectTodayWidgets } from '@/src/modules/registry';
import { Rise } from '@/src/ui/motion/Rise';

type Entry = { key: string; widgets: ReturnType<typeof collectTodayWidgets> };

function groupWidgets(widgets: ReturnType<typeof collectTodayWidgets>): Entry[] {
  const entries: Entry[] = [];
  for (const widget of widgets) {
    const last = entries[entries.length - 1];
    if (widget.half && last?.widgets[0]?.half && last.widgets.length < 2) last.widgets.push(widget);
    else entries.push({ key: widget.id, widgets: [widget] });
  }
  return entries;
}

function SingleWidget({ widget }: { widget: Entry['widgets'][number] }) {
  return <widget.Component />;
}

export default function HomeScreen() {
  const firstName = usePulseFitStore((s) => s.profile.firstName);
  const streak = useStreak();
  const isEnabled = useIsModuleEnabled();
  const entries = groupWidgets(collectTodayWidgets(MODULES, isEnabled, CORE_TODAY_WIDGETS));

  return (
    <Screen tone="home">
      <HomeHeader firstName={firstName} streak={streak} />
      <View className="mt-3.5 gap-3.5">
        {entries.map((entry, i) => (
          <Rise key={entry.key} index={i + 1}>
            {entry.widgets.length > 1 || entry.widgets[0].half ? (
              <View className="flex-row gap-3.5">
                {entry.widgets.map((w) => (
                  <Fragment key={w.id}>
                    <w.Component />
                  </Fragment>
                ))}
              </View>
            ) : (
              <SingleWidget widget={entry.widgets[0]} />
            )}
          </Rise>
        ))}
      </View>
    </Screen>
  );
}
