import { useState } from 'react';

import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { TabHeader } from '@/components/ui/TabHeader';
import { TAB_ICONS } from '@/components/ui/tabIcons';
import { MODULES } from '@/src/modules';
import { isModuleEnabled } from '@/src/modules/flags';
import { collectDashboards } from '@/src/modules/registry';

export default function TrackingScreen() {
  const dashboards = collectDashboards(MODULES, isModuleEnabled);
  const [selectedId, setSelectedId] = useState(dashboards[0]?.id);
  const current = dashboards.find((d) => d.id === selectedId) ?? dashboards[0];

  return (
    <Screen>
      <TabHeader icon={TAB_ICONS.suivi} tint="accent" eyebrow="Mes données" title="Suivi" />
      {dashboards.length > 1 ? (
        <Segmented
          className="mt-6"
          options={dashboards.map(({ id, title }) => ({ id, label: title }))}
          value={current?.id ?? ''}
          onChange={setSelectedId}
        />
      ) : null}
      {current ? <current.Component /> : null}
    </Screen>
  );
}
