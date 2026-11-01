import * as Haptics from 'expo-haptics';
import { type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { useTheme } from '@/src/ui/useTheme';

export type ModuleTab = {
  id: string;
  label: string;
  icon?: LucideIcon;
  color: 'sport' | 'nutri' | 'iris' | 'aqua';
};

type ModuleTabsProps = {
  tabs: ModuleTab[];
  value: string;
  onChange: (id: string) => void;
  drag?: SharedValue<number>;
  dragWidth?: number;
};

const SLIDE = Easing.bezier(0.3, 1.3, 0.5, 1);

export function ModuleTabs({ tabs, value, onChange, drag, dragWidth = 0 }: ModuleTabsProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.id === value));
  const slot = width / Math.max(tabs.length, 1);
  const x = useSharedValue(0);

  useEffect(() => {
    const target = index * slot + 12;
    if (drag && dragWidth > 0 && x.get() !== 0) {
      x.set(x.get() + (-drag.get() / dragWidth) * slot);
      drag.set(0);
    }
    x.set(reduced || x.get() === 0 ? target : withTiming(target, { duration: 600, easing: SLIDE }));
  }, [index, slot, reduced, x, drag, dragWidth]);

  const underline = useAnimatedStyle(() => {
    const follow = drag && dragWidth > 0 ? (-drag.get() / dragWidth) * slot : 0;
    return { transform: [{ translateX: x.get() + follow }] };
  });

  if (tabs.length < 2) return null;

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="relative flex-row border-b border-fg/10">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(tab.id);
            }}
            className="h-12 flex-1 flex-row items-center justify-center gap-2 active:opacity-70">
            {Icon ? (
              <Icon color={selected ? colors.fg : colors.muted} size={18} strokeWidth={selected ? 2.2 : 1.8} />
            ) : null}
            <Text
              numberOfLines={1}
              className={`text-[17px] ${selected ? 'font-semibold text-fg' : 'font-medium text-muted'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
      {slot > 0 ? (
        <Animated.View
          pointerEvents="none"
          className="absolute -bottom-px h-[3px] rounded-sm"
          style={[
            { width: Math.max(0, slot - 24), backgroundColor: colors[tabs[index].color] },
            underline,
          ]}
        />
      ) : null}
    </View>
  );
}
