import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Dumbbell, House, ScanLine } from 'lucide-react-native';
import { type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS = {
  index: House,
  scan: ScanLine,
  training: Dumbbell,
} as const;

export function TabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <View className="bg-canvas px-8 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="flex-row items-center rounded-full border border-fg/5 bg-surface p-1.5">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isScan = route.name === 'scan';
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? House;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              void Haptics.selectionAsync();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={descriptors[route.key].options.title}
              accessibilityState={{ selected: focused }}
              className={`h-12 items-center justify-center rounded-full active:opacity-70 ${
                isScan ? 'mx-2 w-20 bg-accent' : `flex-1 ${focused ? 'bg-fg/5' : ''}`
              }`}>
              <Icon
                color={isScan ? colors.accentFg : focused ? colors.fg : colors.muted}
                size={21}
                strokeWidth={focused || isScan ? 2.2 : 1.7}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
