import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { lipHeight, minTouch, radius } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'reward';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

/** Tactile button: a darker "lip" below; the face sinks on press. */
export function Button({ title, onPress, variant = 'primary', disabled, style, accessibilityHint }: Props) {
  const { c } = useTheme();
  const sink = useRef(new Animated.Value(0)).current;
  const spring = (to: number) =>
    Animated.spring(sink, { toValue: to, damping: 15, stiffness: 180, useNativeDriver: true }).start();

  const palette = {
    primary: { face: c.primary, lip: c.primaryLip, text: 'onPrimary' as const },
    secondary: { face: c.surface, lip: c.line, text: 'text' as const },
    reward: { face: c.accent, lip: c.accentLip, text: 'onAccent' as const },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={() => spring(lipHeight - 1)}
      onPressOut={() => spring(0)}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={[styles.lip, { backgroundColor: palette.lip }]}>
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: palette.face, transform: [{ translateY: sink }] },
            variant === 'secondary' && { borderWidth: 1, borderColor: c.line },
          ]}
        >
          <Text variant="bodyStrong" color={palette.text}>
            {title}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: { borderRadius: radius.button, paddingBottom: lipHeight },
  face: {
    minHeight: minTouch + 4,
    borderRadius: radius.button,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
});
