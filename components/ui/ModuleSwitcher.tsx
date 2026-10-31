import { Fragment } from 'react';
import { View } from 'react-native';

import { ModuleTabs } from '@/components/ui/ModuleTabs';
import { MODULES } from '@/src/modules';
import { collectSections, type ModuleSection } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { useModuleChoice } from '@/src/ui/useModuleChoice';

type ModuleSwitcherProps = {
  scope: string;
  section: ModuleSection;
  order: string[];
};

export function ModuleSwitcher({ scope, section, order }: ModuleSwitcherProps) {
  const isEnabled = useIsModuleEnabled();
  const sections = collectSections(MODULES, isEnabled, section, order);
  const [value, choose] = useModuleChoice(
    scope,
    sections.map((s) => s.id),
  );
  const current = sections.find((s) => s.id === value);

  return (
    <View className="gap-3.5">
      <ModuleTabs
        tabs={sections.map((s) => ({
          id: s.id,
          label: s.title,
          icon: s.module.icon,
          color: s.module.color ?? 'sport',
        }))}
        value={value}
        onChange={choose}
      />
      {current ? (
        <Fragment key={current.id}>
          <current.Component />
        </Fragment>
      ) : null}
    </View>
  );
}
