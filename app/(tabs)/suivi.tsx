import { useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { Segmented } from '@/components/ui/Segmented';
import { MODULES } from '@/src/modules';
import { isModuleEnabled } from '@/src/modules/flags';
import { collectDashboards } from '@/src/modules/registry';

export default function TrackingScreen() {
  const dashboards = collectDashboards(MODULES, isModuleEnabled);
  const [selectedId, setSelectedId] = useState(dashboards[0]?.id);
  const current = dashboards.find((d) => d.id === selectedId) ?? dashboards[0];

  return (
    <Screen tone="suivi">
      <View className="gap-3.5">
        <ScreenTitle title="Suivi" />
        {dashboards.length > 1 ? (
          <Segmented
            options={dashboards.map(({ id, title }) => ({ id, label: title }))}
            value={current?.id ?? ''}
            onChange={setSelectedId}
          />
        ) : null}
        {current ? <current.Component /> : null}
      </View>
    </Screen>
  );
}
