import { Fragment, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ModuleTabs } from '@/components/ui/ModuleTabs';
import { MODULES } from '@/src/modules';
import { collectSections, type ModuleSection } from '@/src/modules/registry';
import { useIsModuleEnabled } from '@/src/modules/useModules';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useModuleChoice } from '@/src/ui/useModuleChoice';

type ModuleSwitcherProps = {
  scope: string;
  section: ModuleSection;
  order: string[];
};

const SPRING = { damping: 20, stiffness: 260, mass: 0.7 };
const EDGE_RESISTANCE = 0.25;
const NUDGE = 28;
const nudged = new Set<string>();

export function ModuleSwitcher({ scope, section, order }: ModuleSwitcherProps) {
  const isEnabled = useIsModuleEnabled();
  const reduced = useReducedMotion();
  const sections = collectSections(MODULES, isEnabled, section, order);
  const ids = sections.map((s) => s.id);
  const [value, choose] = useModuleChoice(scope, ids);
  const current = sections.find((s) => s.id === value);
  const [width, setWidth] = useState(0);
  const drag = useSharedValue(0);
  const offset = useSharedValue(0);
  const index = ids.indexOf(value);
  const last = ids.length - 1;
  const multi = ids.length > 1;

  useEffect(() => {
    if (!multi || reduced || nudged.has(scope)) return;
    nudged.add(scope);
    const dir = index < last ? -1 : 1;
    offset.set(
      withDelay(
        700,
        withSequence(
          withTiming(dir * NUDGE, { duration: 260, easing: Easing.out(Easing.cubic) }),
          withSpring(0, SPRING),
        ),
      ),
    );
  }, [multi, reduced, scope, index, last, offset]);

  const gesture = Gesture.Pan()
    .enabled(multi)
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      'worklet';
      const blocked = (e.translationX > 0 && index <= 0) || (e.translationX < 0 && index >= last);
      const dx = blocked ? e.translationX * EDGE_RESISTANCE : e.translationX;
      drag.set(dx);
      if (!reduced) offset.set(dx);
    })
    .onEnd((e) => {
      'worklet';
      const dir = e.translationX < 0 ? 1 : -1;
      const next = ids[index + dir];
      const committed =
        next !== undefined && (Math.abs(e.translationX) > width * 0.25 || Math.abs(e.velocityX) > 500);
      if (!committed) {
        offset.set(reduced ? 0 : withSpring(0, SPRING));
        drag.set(reduced ? 0 : withSpring(0, SPRING));
        return;
      }
      scheduleOnRN(choose, next);
      offset.set(reduced ? 0 : -dir * width * 0.25);
      if (!reduced) offset.set(withSpring(0, SPRING));
    });

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

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
        drag={drag}
        dragWidth={width}
      />
      <GestureDetector gesture={gesture}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {current ? (
            <Animated.View style={contentStyle}>
              <Fragment key={current.id}>
                <current.Component />
              </Fragment>
            </Animated.View>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}
