import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '../kit/Text';

export const UNDO_MS = 6000;

type Props = { message: string | null; onUndo: () => void; onDone: () => void; bottom: number };

/** "Read · done  Undo" popup after completing a habit. Disappears after a few seconds. */
export function UndoToast({ message, onUndo, onDone, bottom }: Props) {
  const { c } = useTheme();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, UNDO_MS);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: space.screen, right: space.screen, bottom, flexDirection: 'row', alignItems: 'center', gap: space.m, backgroundColor: c.text, borderRadius: radius.button, paddingLeft: space.l, paddingRight: space.xs, minHeight: 52, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}
    >
      <Text style={{ flex: 1, color: c.bg }} numberOfLines={1}>{message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Undo" onPress={onUndo} style={({ pressed }) => ({ minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
        <Text variant="bodyStrong" style={{ color: c.bg, textDecorationLine: 'underline' }}>Undo</Text>
      </Pressable>
    </View>
  );
}
