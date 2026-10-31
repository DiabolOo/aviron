import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/src/ui/useTheme';

const SIZE = 34;

export function GradientName({ name }: { name: string }) {
  const { scheme, colors } = useTheme();
  const [width, setWidth] = useState(0);
  const dark = scheme === 'dark';
  const height = Math.round(SIZE * 1.25);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le profil de ${name}`}
      onPress={() => router.navigate('/profile')}
      className="min-h-11 flex-row items-center self-start active:opacity-70">
      <View style={{ width: width || undefined, height }}>
        <Text
          onLayout={(e) => setWidth(Math.ceil(e.nativeEvent.layout.width) + 2)}
          numberOfLines={1}
          style={{ opacity: 0, fontSize: SIZE, lineHeight: height, fontFamily: 'Inter_800ExtraBold' }}>
          {name}
        </Text>
        {width > 0 ? (
          <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
            <Defs>
              <LinearGradient id="name-gradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={dark ? '#A79BFF' : '#5B49E0'} />
                <Stop offset="1" stopColor="#E5588A" />
              </LinearGradient>
            </Defs>
            <SvgText
              x={0}
              y={SIZE + 2}
              fontSize={SIZE}
              fontFamily="Inter_800ExtraBold"
              fill={dark ? '#6D5AE6' : '#6D5AE6'}
              opacity={dark ? 0.55 : 0.32}
              transform="translate(0 3)">
              {name}
            </SvgText>
            <SvgText
              x={0}
              y={SIZE + 2}
              fontSize={SIZE}
              fontFamily="Inter_800ExtraBold"
              fill="url(#name-gradient)"
              stroke={dark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)'}
              strokeWidth={0.8}>
              {name}
            </SvgText>
          </Svg>
        ) : null}
      </View>
      <ChevronRight color={colors.muted} size={22} strokeWidth={2.4} style={{ marginLeft: 2, marginTop: 4 }} />
    </Pressable>
  );
}
