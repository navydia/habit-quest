import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { addDays } from '@/src/game/dates';
import { isCompleted, scheduledHabits } from '@/src/game/habits';
import type { DayKey, Habit, SaveData, Schedule } from '@/src/game/types';
import { minTouch, space } from '@/src/theme/tokens';
import { Card } from '../kit/Card';
import { Checkbox } from '../kit/Checkbox';
import { Text } from '../kit/Text';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function describeSchedule(s: Schedule): string {
  return s.kind === 'daily' ? 'Daily' : s.days.map((d) => DAY_NAMES[d]).join(' · ');
}

type Props = { save: SaveData; today: DayKey; onToggle: (habitId: string, key: DayKey) => void };

export function HabitList({ save, today, onToggle }: Props) {
  const [showYesterday, setShowYesterday] = useState(false);
  const todays = scheduledHabits(save.habits, today);
  const yesterday = addDays(today, -1);
  // All of yesterday's habits stay listed, so an accidental tick can be undone.
  const yesterdays = scheduledHabits(save.habits, yesterday);
  const anyMissed = yesterdays.some((h) => !isCompleted(save.completions, h.id, yesterday));

  const row = (h: Habit, key: DayKey) => (
    <Checkbox
      key={`${key}-${h.id}`}
      label={h.name}
      detail={describeSchedule(h.schedule)}
      checked={isCompleted(save.completions, h.id, key)}
      onToggle={() => onToggle(h.id, key)}
    />
  );

  return (
    <View style={{ gap: space.m }}>
      <Text variant="title" accessibilityRole="header">Today</Text>
      {todays.length > 0 ? (
        <Card style={{ paddingVertical: space.s }}>{todays.map((h) => row(h, today))}</Card>
      ) : save.habits.length > 0 ? (
        <Text color="textMuted">Nothing scheduled today. Enjoy the quiet.</Text>
      ) : null}
      {yesterdays.length > 0 && (anyMissed || showYesterday) && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showYesterday }}
            onPress={() => setShowYesterday((v) => !v)}
            style={{ minHeight: minTouch, justifyContent: 'center' }}
          >
            <Text variant="label" color="textMuted">
              {showYesterday ? '▾' : '▸'} FORGOT TO LOG YESTERDAY?
            </Text>
          </Pressable>
          {showYesterday && <Card style={{ paddingVertical: space.s }}>{yesterdays.map((h) => row(h, yesterday))}</Card>}
        </View>
      )}
    </View>
  );
}
