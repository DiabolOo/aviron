import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { House } from 'lucide-react-native';
import { type ComponentProps, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Gradient } from '@/components/ui/Gradient';
import { Text } from '@/components/ui/Text';
import { TAB_ICONS as ICONS, TAB_ORDER } from '@/components/ui/tabIcons';
import { useReducedMotion } from '@/src/ui/motion/useReducedMotion';
import { AI_GRADIENT } from '@/src/ui/theme/tokens';
import { useTheme } from '@/src/ui/useTheme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const SLIDE = Easing.bezier(0.16, 1, 0.3, 1);
const PAD = 6;

function AgentGlow() {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.set(
      reduced
        ? 0
        : withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
  }, [pulse, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.get()) + 0.1,
    transform: [{ scale: 1 + pulse.get() * 0.28 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute h-[54px] w-[54px] rounded-full bg-iris"
      style={style}
    />
  );
}

export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const visible = state.routes.filter((r) => (TAB_ORDER as readonly string[]).includes(r.name));
  const activeIndex = visible.findIndex((r) => r.key === state.routes[state.index]?.key);
  const slotW = Math.max(0, (width - PAD * 2) / visible.length);
  const x = useSharedValue(0);

  useEffect(() => {
    const target = PAD + Math.max(0, activeIndex) * slotW;
    x.set(reduced || x.get() === 0 ? target : withTiming(target, { duration: 700, easing: SLIDE }));
  }, [activeIndex, slotW, reduced, x]);

  const padStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const activeIsAgent = state.routes[state.index]?.name === 'agent';
  const showPad = activeIndex >= 0 && !activeIsAgent;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-4"
      style={{ bottom: Math.max(insets.bottom, 12) + 8 }}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="h-[72px] flex-row items-center rounded-full px-1.5"
        style={{
          backgroundColor: colors.navBg,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}>
        {slotW > 0 && showPad ? (
          <Animated.View
            pointerEvents="none"
            className="absolute top-2 h-[54px] rounded-full"
            style={[{ width: slotW, backgroundColor: colors.navPad }, padStyle]}
          />
        ) : null}
        {visible.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? House;
          const title = descriptors[route.key].options.title ?? route.name;
          const isAgent = route.name === 'agent';

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (focused || event.defaultPrevented) return;
            void (isAgent
              ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              : Haptics.selectionAsync());
            navigateToTab(route.key);
          };

          return (
            <View key={route.key} className="flex-1 items-center justify-center">
              <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityState={{ selected: focused }}
                className="h-[54px] w-full items-center justify-center active:scale-95">
                {isAgent ? (
                  <View className="h-[54px] w-[54px] items-center justify-center">
                    <AgentGlow />
                    <Gradient
                      colors={AI_GRADIENT}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: focused ? 3 : 0,
                        borderColor: colors.cardBorder,
                      }}>
                      <Icon color="#FFFFFF" size={26} strokeWidth={2} />
                    </Gradient>
                  </View>
                ) : (
                  <>
                    <Icon
                      color={focused ? colors.fg : colors.navMuted}
                      size={25}
                      strokeWidth={focused ? 2 : 1.7}
                    />
                    <Text
                      numberOfLines={1}
                      className={`mt-[3px] text-[13px] ${
                        focused ? 'font-semibold text-fg' : 'font-medium'
                      }`}
                      style={focused ? undefined : { color: colors.navMuted }}>
                      {title}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
