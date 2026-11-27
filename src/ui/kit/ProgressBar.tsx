import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import type { ColorTokens } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';

type Props = { value: number; label: string; tone?: keyof ColorTokens; height?: number };

export function ProgressBar({ value, label, tone = 'primary', height = 14 }: Props) {
  const { c } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));
  const width = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: clamped, duration: 400, useNativeDriver: false }).start();
  }, [clamped, width]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{ height, borderRadius: height / 2, backgroundColor: c.surfaceSunk, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: c[tone],
          width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
