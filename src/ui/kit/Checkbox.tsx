import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { minTouch, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

type Props = { label: string; checked: boolean; onToggle: () => void; detail?: string };

export function Checkbox({ label, checked, onToggle, detail }: Props) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => {
        if (!checked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onToggle();
      }}
      style={{ minHeight: minTouch + 8, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.s }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: checked ? c.primary : c.line,
          backgroundColor: checked ? c.primary : c.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && (
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Path d="M3 8.5l3.2 3L13 4.5" stroke={c.onPrimary} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={checked ? 'textMuted' : 'text'}>
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" color="textMuted">
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
