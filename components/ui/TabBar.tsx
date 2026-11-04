import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { House } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TAB_ICONS as ICONS, TAB_ORDER } from '@/components/ui/tabIcons';
import { makeStyles, textStyle, useTheme } from '@/src/design';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const useStyles = makeStyles((t) => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: t.size.tabBar,
    flexDirection: 'row',
    backgroundColor: t.colors.surface,
    borderTopWidth: t.size.hairline,
    borderTopColor: t.colors.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: t.size.touchMin,
    gap: t.space.xs,
  },
  label: { ...textStyle('caption', 'regular'), color: t.colors.inkTertiary },
  labelActive: { ...textStyle('caption', 'semibold'), color: t.colors.ink },
}));

export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const { colors, size, fontScaleCaps } = useTheme();
  const styles = useStyles();
  const visible = state.routes.filter((r) => (TAB_ORDER as readonly string[]).includes(r.name));
  const activeKey = state.routes[state.index]?.key;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {visible.map((route) => {
        const focused = activeKey === route.key;
        const Icon = ICONS[route.name as keyof typeof ICONS] ?? House;
        const title = descriptors[route.key].options.title ?? route.name;

        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (focused || event.defaultPrevented) return;
          void Haptics.selectionAsync();
          navigateToTab(route.key);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected: focused }}
            style={styles.tab}>
            <Icon
              color={focused ? colors.ink : colors.inkTertiary}
              size={size.icon}
              strokeWidth={focused ? size.iconStrokeStrong : size.iconStroke}
            />
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={fontScaleCaps.tabLabel}
              style={focused ? styles.labelActive : styles.label}>
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
