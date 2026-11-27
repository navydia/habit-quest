import type { Habit, LifeArea, TimeOfDay } from './types';

/** Habits in the creator's order (`order`), falling back to creation order. Stable. */
export function sortedHabits(list: Habit[]): Habit[] {
  return list
    .map((h, i) => ({ h, key: h.order ?? i }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.h);
}

export type MoveTarget = { beforeId: string | null; timeOfDay?: TimeOfDay; lifeArea?: LifeArea };

/** Moves a habit before another (or to the end), optionally into a new time of day or life area. Renumbers `order`. */
export function moveHabit(list: Habit[], id: string, target: MoveTarget): Habit[] {
  const ordered = sortedHabits(list);
  const moving = ordered.find((h) => h.id === id);
  if (!moving) return list;
  const rest = ordered.filter((h) => h.id !== id);
  const updated: Habit = {
    ...moving,
    ...(target.timeOfDay ? { timeOfDay: target.timeOfDay } : {}),
    ...(target.lifeArea ? { lifeArea: target.lifeArea } : {}),
  };
  const at = target.beforeId ? rest.findIndex((h) => h.id === target.beforeId) : -1;
  const next = at < 0 ? [...rest, updated] : [...rest.slice(0, at), updated, ...rest.slice(at)];
  return next.map((h, i) => ({ ...h, order: i }));
}
