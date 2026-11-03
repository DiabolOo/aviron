import type { Dashboard, LifeModule, TodayWidget } from '@/src/modules/types';

export type ModuleSection = 'plans' | 'dashboards' | 'stats' | 'trends';

export function getEnabledModules(
  modules: LifeModule[],
  isEnabled: (module: LifeModule) => boolean,
): LifeModule[] {
  return modules.filter(isEnabled);
}

export function collectSections(
  modules: LifeModule[],
  isEnabled: (module: LifeModule) => boolean,
  section: ModuleSection,
  order: string[] = [],
): (Dashboard & { module: LifeModule })[] {
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length : i;
  };
  return getEnabledModules(modules, isEnabled)
    .flatMap((module) => (module[section] ?? []).map((d) => ({ ...d, module })))
    .sort((a, b) => rank(a.module.id) - rank(b.module.id));
}

export function collectDashboards(
  modules: LifeModule[],
  isEnabled: (module: LifeModule) => boolean,
): Dashboard[] {
  return collectSections(modules, isEnabled, 'dashboards');
}

export function collectTodayWidgets(
  modules: LifeModule[],
  isEnabled: (module: LifeModule) => boolean,
  coreWidgets: TodayWidget[] = [],
): TodayWidget[] {
  const widgets = [
    ...coreWidgets.map((widget) => ({ ...widget, id: `core:${widget.id}` })),
    ...getEnabledModules(modules, isEnabled).flatMap((module) =>
      module.todayWidgets.map((widget) => ({
        ...widget,
        id: `${module.id}:${widget.id}`,
      })),
    ),
  ];
  const seen = new Set<string>();
  return widgets
    .filter((widget) => {
      if (seen.has(widget.id)) return false;
      seen.add(widget.id);
      return true;
    })
    .sort((a, b) => a.order - b.order);
}
