import { dayKey, endOfDay, weekdayOf } from '@/src/game/dates';

describe('dayKey', () => {
  test('a completion at 23:59 belongs to that day', () => {
    expect(dayKey(new Date(2026, 10, 27, 23, 59))).toBe('2026-11-27');
  });
  test('a completion at 00:01 belongs to the next day', () => {
    expect(dayKey(new Date(2026, 10, 28, 0, 1))).toBe('2026-11-28');
  });
  test('daylight-saving change day still yields the local date', () => {
    expect(dayKey(new Date(2026, 2, 8, 12))).toBe('2026-03-08');
    expect(dayKey(new Date(2026, 10, 1, 12))).toBe('2026-11-01');
  });
});

test('weekdayOf returns 0=Sunday..6=Saturday', () => {
  expect(weekdayOf('2026-11-27')).toBe(5);
  expect(weekdayOf('2026-11-29')).toBe(0);
});

test('endOfDay is the start of the next local day', () => {
  const end = endOfDay('2026-11-27');
  expect(end.getDate()).toBe(28);
  expect(end.getHours()).toBe(0);
});

test('addDays moves across month boundaries and DST', () => {
  const { addDays } = require('@/src/game/dates');
  expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  expect(addDays('2026-03-08', -1)).toBe('2026-03-07');
});
