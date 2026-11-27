import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';
import { LIFE_AREAS, TIMES_OF_DAY, lifeAreaLabel, timeLabel } from '@/src/content/habitOptions';
import { addDays } from '@/src/game/dates';
import { isCompleted, scheduledHabits } from '@/src/game/habits';
import { sortedHabits, type MoveTarget } from '@/src/game/ordering';
import type { DayKey, Habit, LifeArea, SaveData, Schedule, TimeOfDay } from '@/src/game/types';
import { home, minTouch, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '../kit/Card';
import { Text } from '../kit/Text';
import { HabitCard } from './HabitCard';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function describeSchedule(s: Schedule): string {
  if (s.kind === 'daily') return 'Daily';
  if (s.kind === 'interval') return s.every === 1 ? 'Daily' : `Every ${s.every} days`;
  return s.days.map((d) => DAY_NAMES[d]).join(' · ');
}

type GroupBy = SaveData['settings']['groupBy'];
type Section = { key: string; title: string; items: Habit[] };
type Props = {
  save: SaveData;
  today: DayKey;
  onComplete: (habit: Habit, key: DayKey) => void;
  onEdit: (habit: Habit) => void;
  onAdd: (preset: { timeOfDay?: TimeOfDay; lifeArea?: LifeArea }) => void;
  onSort: () => void;
  onMove: (id: string, target: MoveTarget) => void;
  /** Lets the screen stop scrolling while a card is being dragged. */
  onDragging: (dragging: boolean) => void;
};

const sectionTarget = (groupBy: GroupBy, key: string): Partial<MoveTarget> =>
  groupBy === 'timeOfDay' ? { timeOfDay: key as TimeOfDay } : groupBy === 'lifeArea' ? { lifeArea: key as LifeArea } : {};

/** Today's habits as Finch-style cards in sections. Long-press and drag to reorder or move between sections. */
export function HabitList({ save, today, onComplete, onEdit, onAdd, onSort, onMove, onDragging }: Props) {
  const { c } = useTheme();
  const [showYesterday, setShowYesterday] = useState(false);
  const groupBy = save.settings.groupBy;
  const scheduled = scheduledHabits(save.habits, today);
  const todo = sortedHabits(scheduled.filter((h) => !isCompleted(save.completions, h.id, today)));
  const yesterday = addDays(today, -1);
  const missedYesterday = sortedHabits(scheduledHabits(save.habits, yesterday).filter((h) => !isCompleted(save.completions, h.id, yesterday)));

  const sections: Section[] = useMemo(
    () =>
      groupBy === 'timeOfDay'
        ? TIMES_OF_DAY.map((t) => ({ key: t.id, title: t.label, items: todo.filter((h) => h.timeOfDay === t.id) }))
        : groupBy === 'lifeArea'
          ? LIFE_AREAS.map((a) => ({ key: a.id, title: `${a.emoji} ${a.label}`, items: todo.filter((h) => h.lifeArea === a.id) }))
          : [{ key: 'custom', title: 'Your order', items: todo }],
    [groupBy, todo],
  );
  // While dragging, every section is shown so a card can be dropped into an empty one.
  const [dragId, setDragId] = useState<string | null>(null);
  const visible = sections.filter((s) => s.items.length > 0 || (dragId && groupBy !== 'custom'));

  // ---- drag state (positions are relative to the list container) ----
  const layout = useRef(new Map<string, { y: number; h: number }>()).current;
  const [dy] = useState(() => new Animated.Value(0));
  const dragRef = useRef<string | null>(null);
  const dyRef = useRef(0);

  const drop = () => {
    const id = dragRef.current;
    dragRef.current = null;
    setDragId(null);
    onDragging(false);
    dy.setValue(0);
    if (!id) return;
    const me = layout.get(`row:${id}`);
    if (!me) return;
    const center = me.y + me.h / 2 + dyRef.current;
    // Section = last header above the drop point.
    let section = visible[0]?.key ?? 'custom';
    for (const s of visible) {
      const hdr = layout.get(`hdr:${s.key}`);
      if (hdr && hdr.y < center) section = s.key;
    }
    const sec = visible.find((s) => s.key === section);
    const before = sec?.items.find((h) => h.id !== id && (layout.get(`row:${h.id}`)?.y ?? 0) + (layout.get(`row:${h.id}`)?.h ?? 0) / 2 > center);
    // Dropping at the end of a section: go before the next section's first card, so the order matches what you see.
    const nextFirst = before ? undefined : visible.slice(visible.indexOf(sec!) + 1).flatMap((s) => s.items).find((h) => h.id !== id);
    onMove(id, { beforeId: before?.id ?? nextFirst?.id ?? null, ...sectionTarget(groupBy, section) });
  };

  // The responder is created once; it calls the latest drop() through a ref.
  const dropRef = useRef(drop);
  useEffect(() => {
    dropRef.current = drop;
  });
  // Refs are only read inside gesture callbacks (never during render); the compiler lint can't see that.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => dragRef.current !== null,
      onMoveShouldSetPanResponder: () => dragRef.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, gesture) => {
        dyRef.current = gesture.dy;
        dy.setValue(gesture.dy);
      },
      onPanResponderRelease: () => dropRef.current(),
      onPanResponderTerminate: () => dropRef.current(),
    }),
  );

  const startDrag = (id: string) => {
    dragRef.current = id;
    dyRef.current = 0;
    dy.setValue(0);
    setDragId(id);
    onDragging(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  /** Screen-reader alternative to dragging. */
  const step = (h: Habit, dir: 'up' | 'down') => {
    const flat = visible.flatMap((s) => s.items.map((x) => ({ h: x, section: s.key })));
    const i = flat.findIndex((x) => x.h.id === h.id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= flat.length) return;
    const neighbour = flat[j];
    const beforeId = dir === 'up' ? neighbour.h.id : (flat[j + 1]?.h.id ?? null);
    onMove(h.id, { beforeId, ...sectionTarget(groupBy, neighbour.section) });
  };

  const subtitle = (h: Habit) =>
    [groupBy === 'lifeArea' ? timeLabel(h.timeOfDay) : lifeAreaLabel(h.lifeArea), describeSchedule(h.schedule), h.id === save.boss.habitId ? '◆ Boss habit' : null]
      .filter(Boolean)
      .join(' · ');

  const left = todo.length;
  return (
    <View style={{ gap: space.m }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="title" accessibilityRole="header" style={{ color: home.text, flex: 1 }}>
          {scheduled.length === 0 ? 'Today' : left === 0 ? 'All done for today' : `${left} ${left === 1 ? 'habit' : 'habits'} left for today`}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Sort habits" onPress={onSort} hitSlop={6} style={({ pressed }) => ({ minHeight: minTouch, minWidth: minTouch, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text variant="title" style={{ color: home.text }}>⇅</Text>
        </Pressable>
      </View>

      {scheduled.length === 0 && save.habits.length > 0 && <Text style={{ color: home.muted }}>Nothing scheduled today. Enjoy the quiet.</Text>}
      {scheduled.length > 0 && left === 0 && <Text style={{ color: home.muted }}>You can find them in your Log.</Text>}

      <View {...responder.panHandlers} style={{ gap: space.s }}>
        {visible.map((s) => (
          <View key={s.key} style={{ gap: space.s }}>
            {groupBy !== 'custom' && (
              <View onLayout={(e) => layout.set(`hdr:${s.key}`, { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, marginTop: space.s }}>
                <Text variant="bodyStrong" style={{ color: home.text }}>{s.title}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: home.line }} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add a habit to ${s.title}`}
                  onPress={() => onAdd(sectionTarget(groupBy, s.key))}
                  style={({ pressed }) => ({ width: 32, height: 32, borderRadius: 16, backgroundColor: c.ember, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
                  hitSlop={6}
                >
                  <Text variant="bodyStrong" color="onEmber">+</Text>
                </Pressable>
              </View>
            )}
            {s.items.map((h) => (
              <Animated.View
                key={h.id}
                onLayout={(e) => layout.set(`row:${h.id}`, { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })}
                style={dragId === h.id ? { zIndex: 10, transform: [{ translateY: dy }] } : undefined}
              >
                <HabitCard
                  habit={h}
                  subtitle={subtitle(h)}
                  lifted={dragId === h.id}
                  onComplete={() => onComplete(h, today)}
                  onOpen={() => onEdit(h)}
                  onLongPress={() => startDrag(h.id)}
                  onMove={(dir) => step(h, dir)}
                />
              </Animated.View>
            ))}
            {s.items.length === 0 && dragId && <View style={{ height: 48, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: home.dash }} />}
          </View>
        ))}
      </View>

      {missedYesterday.length > 0 && (
        <View>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showYesterday }} onPress={() => setShowYesterday((v) => !v)} style={{ minHeight: minTouch, justifyContent: 'center' }}>
            <Text variant="label" style={{ color: home.muted }}>{showYesterday ? '▾' : '▸'} Forgot to log yesterday?</Text>
          </Pressable>
          {showYesterday && (
            <Card style={{ gap: space.s, backgroundColor: 'transparent', borderWidth: 0, padding: 0 }}>
              {missedYesterday.map((h) => (
                <HabitCard key={`y-${h.id}`} habit={h} subtitle="Yesterday" onComplete={() => onComplete(h, yesterday)} onOpen={() => onEdit(h)} />
              ))}
            </Card>
          )}
        </View>
      )}
    </View>
  );
}
