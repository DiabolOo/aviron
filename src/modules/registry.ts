import type { LifeModule, TodayWidget } from '@/src/modules/types';

export function getEnabledModules(
  modules: LifeModule[],
  isEnabled: (module: LifeModule) => boolean,
): LifeModule[] {
  return modules.filter(isEnabled);
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
