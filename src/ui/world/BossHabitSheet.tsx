import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Habit } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

type Props = { visible: boolean; habits: Habit[]; currentId: string | null; tokens: number; onClose: () => void; onChoose: (id: string) => void };

/** Pick the habit that earns boss tokens. Switching away with tokens asks first (they reset). */
export function BossHabitSheet({ visible, habits, currentId, tokens, onClose, onChoose }: Props) {
  const { c } = useTheme();
  const [pending, setPending] = useState<string | null>(null);
  const pick = (id: string) => {
    if (id === currentId) return onClose();
    if (currentId && tokens > 0) return setPending(id);
    onChoose(id);
    onClose();
  };
  return (
    <Sheet visible={visible} title="Boss habit" onClose={() => { setPending(null); onClose(); }}>
      <View style={{ gap: space.m }} accessibilityRole="radiogroup">
        <Text color="textMuted">Pick a habit you find hard. Each time you do it, you earn a boss token. Six tokens summon a boss.</Text>
        {habits.filter((h) => !h.archived).map((h) => (
          <Pressable
            key={h.id}
            accessibilityRole="radio"
            accessibilityLabel={h.name}
            accessibilityState={{ checked: h.id === currentId }}
            onPress={() => pick(h.id)}
            style={({ pressed }) => ({ minHeight: minTouch + 4, justifyContent: 'center', paddingHorizontal: space.l, borderRadius: radius.button, borderWidth: h.id === currentId ? 2 : 1, borderColor: h.id === currentId ? c.ember : c.line, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Text variant="bodyStrong">{h.id === currentId ? '◆ ' : ''}{h.name}</Text>
          </Pressable>
        ))}
        {pending && (
          <View style={{ gap: space.s }}>
            <Text>Switching resets your {tokens} boss {tokens === 1 ? 'token' : 'tokens'}.</Text>
            <Button title={`Switch and lose ${tokens} ${tokens === 1 ? 'token' : 'tokens'}`} onPress={() => { onChoose(pending); setPending(null); onClose(); }} />
            <Button title="Keep my tokens" variant="secondary" onPress={() => setPending(null)} />
          </View>
        )}
      </View>
    </Sheet>
  );
}
