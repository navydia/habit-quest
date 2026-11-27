import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LIFE_AREAS, TIMES_OF_DAY, lifeAreaLabel, timeLabel } from '@/src/content/habitOptions';
import { addDays } from '@/src/game/dates';
import { isCompleted, scheduledHabits } from '@/src/game/habits';
import type { DayKey, Habit, SaveData, Schedule } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '../kit/Card';
import { Text } from '../kit/Text';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function describeSchedule(s: Schedule): string {
  if (s.kind === 'daily') return 'Daily';
  if (s.kind === 'interval') return s.every === 1 ? 'Daily' : `Every ${s.every} days`;
  return s.days.map((d) => DAY_NAMES[d]).join(' · ');
}

type Props = {
  save: SaveData;
  today: DayKey;
  onComplete: (habit: Habit, key: DayKey) => void;
  onEdit: (habit: Habit) => void;
  onGroupBy: (g: SaveData['settings']['groupBy']) => void;
};

/** Today's habits that are still to do. Completing one removes it from the list (Undo is a popup). */
export function HabitList({ save, today, onComplete, onEdit, onGroupBy }: Props) {
  const { c } = useTheme();
  const [showYesterday, setShowYesterday] = useState(false);
  const groupBy = save.settings.groupBy;
  const scheduled = scheduledHabits(save.habits, today);
  const todo = scheduled.filter((h) => !isCompleted(save.completions, h.id, today));
  const yesterday = addDays(today, -1);
  const missedYesterday = scheduledHabits(save.habits, yesterday).filter((h) => !isCompleted(save.completions, h.id, yesterday));

  const groups =
    groupBy === 'timeOfDay'
      ? TIMES_OF_DAY.map((t) => ({ key: t.id, title: t.label, items: todo.filter((h) => h.timeOfDay === t.id) }))
      : LIFE_AREAS.map((a) => ({ key: a.id, title: `${a.emoji} ${a.label}`, items: todo.filter((h) => h.lifeArea === a.id) }));

  const row = (h: Habit, key: DayKey) => (
    <View key={`${key}-${h.id}`} style={{ flexDirection: 'row', alignItems: 'center', minHeight: minTouch + 12 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={h.name}
        accessibilityHint="Marks it done for the day"
        accessibilityState={{ checked: false }}
        onPress={() => onComplete(h, key)}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.s, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: c.line, backgroundColor: c.surface }} />
        <Text style={{ fontSize: 22, lineHeight: 28 }}>{h.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{h.name}</Text>
          <Text variant="caption" color="textMuted">
            {[groupBy === 'timeOfDay' ? lifeAreaLabel(h.lifeArea) : timeLabel(h.timeOfDay), describeSchedule(h.schedule), h.id === save.boss.habitId ? '◆ Boss habit' : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${h.name}`}
        onPress={() => onEdit(h)}
        style={({ pressed }) => ({ width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
      >
        <Text variant="title" color="textMuted">⋯</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: space.m }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="title" accessibilityRole="header">Today</Text>
        {scheduled.length > 0 && (
          <View style={{ flexDirection: 'row', backgroundColor: c.surfaceSunk, borderRadius: radius.chip, padding: 2 }} accessibilityRole="radiogroup" accessibilityLabel="Group habits by">
            {(['timeOfDay', 'lifeArea'] as const).map((g) => (
              <Pressable
                key={g}
                accessibilityRole="radio"
                accessibilityState={{ checked: groupBy === g }}
                onPress={() => onGroupBy(g)}
                style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: space.m, borderRadius: radius.chip, backgroundColor: groupBy === g ? c.surface : 'transparent' }}
                hitSlop={4}
              >
                <Text variant="label" color={groupBy === g ? 'text' : 'textMuted'}>{g === 'timeOfDay' ? 'Time of day' : 'Life area'}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {scheduled.length === 0 && save.habits.length > 0 && <Text color="textMuted">Nothing scheduled today. Enjoy the quiet.</Text>}
      {scheduled.length > 0 && todo.length === 0 && <Text color="textMuted">All done for today. You can find them in your Log.</Text>}
      {groups
        .filter((gr) => gr.items.length > 0)
        .map((gr) => (
          <View key={gr.key} style={{ gap: space.xs }}>
            <Text variant="label" color="textMuted">{gr.title}</Text>
            <Card style={{ paddingVertical: space.xs }}>{gr.items.map((h) => row(h, today))}</Card>
          </View>
        ))}

      {missedYesterday.length > 0 && (
        <View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showYesterday }} onPress={() => setShowYesterday((v) => !v)} style={{ minHeight: minTouch, justifyContent: 'center' }}>
            <Text variant="label" color="textMuted">{showYesterday ? '▾' : '▸'} Forgot to log yesterday?</Text>
          </Pressable>
          {showYesterday && <Card style={{ paddingVertical: space.xs }}>{missedYesterday.map((h) => row(h, yesterday))}</Card>}
        </View>
      )}
    </View>
  );
}
