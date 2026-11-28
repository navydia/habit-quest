import { pickInsets } from '@/src/ui/useSafeInsets';

test('when the screen reports 0 (native tabs, modals), the window insets are used', () => {
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  const device = { top: 59, bottom: 34, left: 0, right: 0 };
  expect(pickInsets(zero, device, 'ios')).toEqual(device);
});

test('the larger of the two wins', () => {
  expect(pickInsets({ top: 62, bottom: 0, left: 0, right: 0 }, { top: 59, bottom: 34, left: 0, right: 0 }, 'ios')).toEqual({ top: 62, bottom: 34, left: 0, right: 0 });
});

test('on iOS with nothing measured, the status bar (20pt) is still kept clear', () => {
  expect(pickInsets({ top: 0, bottom: 0, left: 0, right: 0 }, null, 'ios').top).toBe(20);
  expect(pickInsets({ top: 0, bottom: 0, left: 0, right: 0 }, null, 'web').top).toBe(0);
});
