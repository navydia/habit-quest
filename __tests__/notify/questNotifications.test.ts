jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'quest-return'),
  getPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

import * as Notifications from 'expo-notifications';
import { cancelReturn, ensurePermission, scheduleReturn } from '@/src/notify/questNotifications';

const N = Notifications as jest.Mocked<typeof Notifications>;
beforeEach(() => jest.clearAllMocks());

test('scheduling replaces the previous return notification', async () => {
  const end = new Date(Date.now() + 3600_000);
  await scheduleReturn(end);
  expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('quest-return');
  const req = N.scheduleNotificationAsync.mock.calls[0][0];
  expect(req.identifier).toBe('quest-return');
  expect(req.content.body).toBe('Your hero has returned!');
  expect(req.trigger).toEqual({ type: 'date', date: end });
});

test('a time in the past schedules nothing', async () => {
  await scheduleReturn(new Date(Date.now() - 1000));
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('quest-return');
});

test('cancelReturn cancels by the fixed identifier', async () => {
  await cancelReturn();
  expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('quest-return');
});

test('ensurePermission asks when not yet granted', async () => {
  expect(await ensurePermission()).toBe(true);
  expect(N.requestPermissionsAsync).toHaveBeenCalled();
});
