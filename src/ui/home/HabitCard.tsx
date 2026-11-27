import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { lifeAreaColor } from '@/src/content/habitOptions';
import type { Habit } from '@/src/game/types';
import { lipHeight, minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '../kit/Text';

type Props = {
  habit: Habit;
  subtitle: string;
  lifted?: boolean;
  onComplete: () => void;
  onOpen: () => void;
  onLongPress?: () => void;
  onMove?: (dir: 'up' | 'down') => void;
};

/** Finch-style habit card: emoji blob, name, subtitle, and a big tactile check button. */
export function HabitCard({ habit, subtitle, lifted, onComplete, onOpen, onLongPress, onMove }: Props) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
        borderRadius: 24,
        paddingLeft: space.m,
        paddingRight: space.m,
        paddingVertical: space.m,
        gap: space.m,
        shadowColor: '#000',
        shadowOpacity: lifted ? 0.25 : 0.08,
        shadowRadius: lifted ? 16 : 6,
        shadowOffset: { width: 0, height: lifted ? 8 : 3 },
        elevation: lifted ? 8 : 2,
        transform: [{ scale: lifted ? 1.03 : 1 }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${subtitle}`}
        accessibilityHint="Opens the habit. Long-press to drag."
        accessibilityActions={[{ name: 'moveUp', label: 'Move up' }, { name: 'moveDown', label: 'Move down' }]}
        onAccessibilityAction={(e) => onMove?.(e.nativeEvent.actionName === 'moveUp' ? 'up' : 'down')}
        onPress={onOpen}
        onLongPress={onLongPress}
        delayLongPress={250}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m, opacity: pressed ? 0.8 : 1 })}
      >
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: lifeAreaColor(habit.lifeArea), alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
          <Text style={{ fontSize: 28, lineHeight: 34 }}>{habit.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" numberOfLines={2}>{habit.name}</Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>{subtitle}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={habit.name}
        accessibilityHint="Marks it done for the day"
        accessibilityState={{ checked: false }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onComplete();
        }}
        hitSlop={4}
      >
        {({ pressed }) => (
          <View style={{ width: minTouch + 12, height: minTouch + 8, borderRadius: radius.button, backgroundColor: c.line, paddingBottom: pressed ? 1 : lipHeight }}>
            <View style={{ flex: 1, borderRadius: radius.button, backgroundColor: c.surfaceSunk, alignItems: 'center', justifyContent: 'center', marginTop: pressed ? lipHeight - 1 : 0 }}>
              <Text variant="title" color="primary">✓</Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
