import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { EMOJI_CHOICES, LIFE_AREAS, TIMES_OF_DAY } from '@/src/content/habitOptions';
import { dayKey } from '@/src/game/dates';
import type { Habit, LifeArea, Schedule, TimeOfDay, Weekday } from '@/src/game/types';
import type { HabitDetails } from '@/src/store/gameStore';
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

type Repeat = 'daily' | 'weekdays' | 'interval';
type Props = {
  visible: boolean;
  /** Edit this habit; add a new one when null. */
  habit: Habit | null;
  onClose: () => void;
  onSave: (details: HabitDetails) => void;
  onArchive?: (id: string) => void;
  /** Boss tokens to warn about when archiving the boss habit. */
  bossTokens?: number;
  isBossHabit?: boolean;
};

export function HabitSheet({ visible, habit, onClose, onSave, onArchive, bossTokens = 0, isBossHabit = false }: Props) {
  const { c, t } = useTheme();
  // Mounted fresh each time it opens (see HomeScreen), so state starts from the habit being edited.
  const start = habit?.schedule ?? { kind: 'daily' as const };
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✨');
  const [lifeArea, setLifeArea] = useState<LifeArea>(habit?.lifeArea ?? 'other');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay ?? 'anytime');
  const [repeat, setRepeat] = useState<Repeat>(start.kind);
  const [days, setDays] = useState<Weekday[]>(start.kind === 'weekdays' ? start.days : [1, 2, 3, 4, 5]);
  const [every, setEvery] = useState(start.kind === 'interval' ? start.every : 2);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // An every-N-days repeat counts from the day it is set, unless it is unchanged.
  const from = start.kind === 'interval' && start.every === every && start.from ? start.from : dayKey(new Date());
  const schedule: Schedule =
    repeat === 'daily' ? { kind: 'daily' } : repeat === 'weekdays' ? { kind: 'weekdays', days: [...days].sort() } : { kind: 'interval', every, from };
  const valid = name.trim().length > 0 && (repeat !== 'weekdays' || days.length > 0);
  const submit = () => {
    if (!valid) return;
    onSave({ name, emoji: emoji.trim() || '✨', lifeArea, timeOfDay, schedule });
    onClose();
  };

  const chip = (label: string, selected: boolean, onPress: () => void, a11y = label) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: minTouch,
        minWidth: minTouch,
        paddingHorizontal: space.m,
        borderRadius: radius.chip,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.surface,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text variant="bodyStrong" color={selected ? 'onPrimary' : 'text'}>{label}</Text>
    </Pressable>
  );
  const section = (title: string) => <Text variant="label" color="textMuted" style={{ marginTop: space.s }}>{title}</Text>;
  const wrap = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: space.s };

  return (
    <Sheet visible={visible} title={habit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <View style={{ gap: space.m }}>
        <View style={{ flexDirection: 'row', gap: space.s }}>
          <TextInput
            value={emoji}
            onChangeText={(v) => setEmoji([...v].slice(-2).join(''))}
            accessibilityLabel="Emoji"
            style={[t.title, { width: 60, textAlign: 'center', color: c.text, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.button, minHeight: minTouch + 8 }]}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Read for 20 minutes"
            placeholderTextColor={c.textMuted}
            accessibilityLabel="Habit name"
            autoFocus={!habit}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={[t.body, { flex: 1, color: c.text, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.button, paddingHorizontal: space.l, minHeight: minTouch + 8 }]}
          />
        </View>
        {/* Kept right under the name field so it stays visible above the keyboard (style rule 17a). */}
        <Button title={habit ? 'Save changes' : 'Add habit'} onPress={submit} disabled={!valid} />
        <View style={wrap}>
          {EMOJI_CHOICES.map((e) => chip(e, emoji === e, () => setEmoji(e), `Emoji ${e}`))}
        </View>

        {section('Life area')}
        <View style={wrap}>{LIFE_AREAS.map((a) => chip(`${a.emoji} ${a.label}`, lifeArea === a.id, () => setLifeArea(a.id), a.label))}</View>

        {section('Time of day')}
        <View style={wrap}>{TIMES_OF_DAY.map((x) => chip(x.label, timeOfDay === x.id, () => setTimeOfDay(x.id)))}</View>

        {section('Repeat')}
        <View style={wrap}>
          {chip('Every day', repeat === 'daily', () => setRepeat('daily'))}
          {chip('Some days', repeat === 'weekdays', () => setRepeat('weekdays'))}
          {chip('Every few days', repeat === 'interval', () => setRepeat('interval'))}
        </View>
        {repeat === 'weekdays' && (
          <View style={wrap}>
            {DAYS.map(({ d, label, name: full }) => chip(label, days.includes(d), () => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d])), full))}
          </View>
        )}
        {repeat === 'interval' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            {chip('−', false, () => setEvery((n) => Math.max(2, n - 1)), 'Fewer days')}
            <Text variant="bodyStrong" accessibilityLiveRegion="polite">Every {every} days</Text>
            {chip('+', false, () => setEvery((n) => Math.min(30, n + 1)), 'More days')}
          </View>
        )}

        <View style={{ marginTop: space.m, gap: space.s }}>
          {habit && onArchive && confirmArchive && isBossHabit && (
            <Text color="ember">This is your boss habit. Archiving it resets your {bossTokens} boss tokens.</Text>
          )}
          {habit && onArchive && (
            <Button
              title={confirmArchive ? 'Tap again to archive' : 'Archive habit'}
              variant="secondary"
              onPress={() => {
                if (!confirmArchive) return setConfirmArchive(true);
                onArchive(habit.id);
                onClose();
              }}
            />
          )}
        </View>
      </View>
    </Sheet>
  );
}
