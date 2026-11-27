import { canLogDay, complete, isCompleted, isScheduledOn, scheduledHabits, uncomplete } from '@/src/game/habits';
import { at, habit } from '../helpers/save';

test('daily habit is scheduled every day', () => {
  expect(isScheduledOn(habit('a'), '2026-11-24')).toBe(true);
});

test('weekday habit is scheduled only on its days', () => {
  const h = habit('a', { kind: 'weekdays', days: [1, 3] });
  expect(isScheduledOn(h, '2026-11-23')).toBe(true); // Monday
  expect(isScheduledOn(h, '2026-11-24')).toBe(false); // Tuesday
});

test('archived habits are never scheduled', () => {
  expect(scheduledHabits([{ ...habit('a'), archived: true }, habit('b')], '2026-11-24').map((h) => h.id)).toEqual(['b']);
});

test('completing twice keeps one record; uncomplete removes it', () => {
  let c = complete([], 'a', '2026-11-27', at('2026-11-27', 9));
  c = complete(c, 'a', '2026-11-27', at('2026-11-27', 10));
  expect(c).toHaveLength(1);
  expect(isCompleted(c, 'a', '2026-11-27')).toBe(true);
  c = uncomplete(c, 'a', '2026-11-27');
  expect(isCompleted(c, 'a', '2026-11-27')).toBe(false);
});

test('only today and yesterday can be logged', () => {
  const now = at('2026-11-27', 9);
  expect(canLogDay('2026-11-27', now)).toBe(true);
  expect(canLogDay('2026-11-26', now)).toBe(true);
  expect(canLogDay('2026-11-25', now)).toBe(false);
  expect(canLogDay('2026-11-28', now)).toBe(false);
});
