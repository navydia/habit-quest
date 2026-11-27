import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Schedule, Weekday } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

const DAYS: { d: Weekday; label: string; name: string }[] = [
  { d: 1, label: 'M', name: 'Monday' },
  { d: 2, label: 'T', name: 'Tuesday' },
  { d: 3, label: 'W', name: 'Wednesday' },
  { d: 4, label: 'T', name: 'Thursday' },
  { d: 5, label: 'F', name: 'Friday' },
  { d: 6, label: 'S', name: 'Saturday' },
  { d: 0, label: 'S', name: 'Sunday' },
];

type Props = { visible: boolean; onClose: () => void; onAdd: (name: string, schedule: Schedule) => void };

export function AddHabitSheet({ visible, onClose, onAdd }: Props) {
  const { c, t } = useTheme();
  const [name, setName] = useState('');
  const [daily, setDaily] = useState(true);
  const [days, setDays] = useState<Weekday[]>([1, 2, 3, 4, 5]);
  const valid = name.trim().length > 0 && (daily || days.length > 0);

  const submit = () => {
    if (!valid) return;
    onAdd(name, daily ? { kind: 'daily' } : { kind: 'weekdays', days: [...days].sort() });
    setName('');
    onClose();
  };

  const chip = (label: string, selected: boolean, onPress: () => void, a11y: string) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        minHeight: minTouch,
        minWidth: minTouch,
        paddingHorizontal: space.m,
        borderRadius: radius.chip,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.surface,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.line,
      })}
    >
      <Text variant="bodyStrong" color={selected ? 'onPrimary' : 'text'}>{label}</Text>
    </Pressable>
  );

  return (
    <Sheet visible={visible} title="New habit" onClose={onClose}>
      <View style={{ gap: space.l }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read for 20 minutes"
          placeholderTextColor={c.textMuted}
          accessibilityLabel="Habit name"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          style={[t.body, { color: c.text, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: space.l, minHeight: minTouch + 8 }]}
        />
        <View style={{ flexDirection: 'row', gap: space.s }}>
          {chip('Every day', daily, () => setDaily(true), 'Every day')}
          {chip('Some days', !daily, () => setDaily(false), 'Some days')}
        </View>
        {!daily && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {DAYS.map(({ d, label, name: full }) =>
              chip(label, days.includes(d), () => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d])), full),
            )}
          </View>
        )}
        <Button title="Add habit" onPress={submit} disabled={!valid} />
      </View>
    </Sheet>
  );
}
