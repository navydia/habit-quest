import { shouldDismissSheet } from '@/src/ui/kit/Sheet';

test('a long pull or a quick flick on the handle closes the sheet; a short slow one springs back', () => {
  expect(shouldDismissSheet(140, 0.1)).toBe(true);
  expect(shouldDismissSheet(30, 1.2)).toBe(true);
  expect(shouldDismissSheet(40, 0.2)).toBe(false);
  expect(shouldDismissSheet(-80, -1)).toBe(false);
  expect(shouldDismissSheet(3, 1.5)).toBe(false); // a jitter on a tap, not a pull
});
