import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { CircleUser, Dumbbell, House, Salad } from 'lucide-react-native';
import { type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/useTheme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS = {
  index: House,
  sport: Dumbbell,
  nutrition: Salad,
  profil: CircleUser,
} as const;

const HAPTICS = {
  index: () => Haptics.selectionAsync(),
  sport: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  nutrition: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  profil: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
} as const;

export function TabBar({ state, descriptors, navigation, insets }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <View className="bg-canvas px-5 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="flex-row items-center rounded-full border border-fg/5 bg-surface p-1.5">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? House;
          const title = descriptors[route.key].options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              void HAPTICS[route.name as keyof typeof HAPTICS]?.();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityState={{ selected: focused }}
              className={`h-12 flex-row items-center justify-center gap-2 rounded-full active:opacity-70 ${
                focused ? 'flex-[1.8] bg-fg' : 'flex-1'
              }`}>
              <Icon
                color={focused ? colors.canvas : colors.muted}
                size={20}
                strokeWidth={focused ? 2.2 : 1.7}
              />
              {focused ? (
                <Text numberOfLines={1} className="text-xs font-semibold text-canvas">
                  {title}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
