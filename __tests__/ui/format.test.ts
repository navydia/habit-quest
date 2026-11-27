import { formatRemaining } from '@/src/ui/format';

test('formats remaining time as hours and minutes, rounding up', () => {
  expect(formatRemaining(5 * 3600_000 + 40 * 60_000)).toBe('5h 40m');
  expect(formatRemaining(8 * 3600_000)).toBe('8h 0m');
  expect(formatRemaining(59 * 60_000 + 1)).toBe('1h 0m');
  expect(formatRemaining(12 * 60_000)).toBe('12m');
  expect(formatRemaining(-5)).toBe('any moment');
});
