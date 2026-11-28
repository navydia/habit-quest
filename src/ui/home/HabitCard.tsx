import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { lifeAreaColor } from '@/src/content/habitOptions';
import type { Habit } from '@/src/game/types';
import { home, lipHeight, minTouch, radius, space } from '@/src/theme/tokens';
import { CheckIcon, DragonToken } from '../icons/Icons';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '../kit/Text';

type Props = {
  habit: Habit;
  subtitle: string;
  lifted?: boolean;
  /** The boss habit: a small token sits on the icon's bottom-right. */
  boss?: boolean;
  onComplete: () => void;
  onOpen: () => void;
  onLongPress?: () => void;
  onMove?: (dir: 'up' | 'down') => void;
};

/** Finch-style habit card: emoji blob, name, subtitle, and a big tactile check button. */
export function HabitCard({ habit, subtitle, lifted, boss, onComplete, onOpen, onLongPress, onMove }: Props) {
  const { c } = useTheme();
  return (
    // Tactile like the buttons: a darker lip below, a light top highlight, and a soft shadow (light from above).
    <View
      style={{
        borderRadius: 24,
        backgroundColor: c.line,
        paddingBottom: lipHeight,
        shadowColor: '#000',
        shadowOpacity: lifted ? 0.3 : 0.18,
        shadowRadius: lifted ? 16 : 8,
        shadowOffset: { width: 0, height: lifted ? 10 : 4 },
        elevation: lifted ? 10 : 4,
        transform: [{ scale: lifted ? 1.03 : 1 }],
      }}
    >
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface,
        borderRadius: 24,
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: space.m,
        paddingVertical: space.s,
        gap: space.m,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${subtitle}${boss ? ', boss habit' : ''}`}
        accessibilityHint="Opens the habit. Long-press to drag."
        accessibilityActions={[{ name: 'moveUp', label: 'Move up' }, { name: 'moveDown', label: 'Move down' }]}
        onAccessibilityAction={(e) => onMove?.(e.nativeEvent.actionName === 'moveUp' ? 'up' : 'down')}
        onPress={onOpen}
        onLongPress={onLongPress}
        delayLongPress={250}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m, opacity: pressed ? 0.8 : 1 })}
      >
        <View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: lifeAreaColor(habit.lifeArea), alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
          <Text style={{ fontSize: 24, lineHeight: 30 }}>{habit.emoji}</Text>
          {boss && (
            <View testID={`boss-token-${habit.id}`} style={{ position: 'absolute', right: -6, bottom: -6, transform: [{ rotate: '4deg' }] }}>
              <DragonToken size={20} earned />
            </View>
          )}
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
          // Same moss as the adventure gauge, so completing a habit visibly feeds it.
          <View style={{ width: minTouch + 8, height: minTouch + 4, borderRadius: radius.button, backgroundColor: '#2C4D38', paddingBottom: pressed ? 1 : lipHeight }}>
            <View style={{ flex: 1, borderRadius: radius.button, backgroundColor: home.fill.moss, alignItems: 'center', justifyContent: 'center', marginTop: pressed ? lipHeight - 1 : 0 }}>
              <CheckIcon color={home.text} />
            </View>
          </View>
        )}
      </Pressable>
    </View>
    </View>
  );
}
