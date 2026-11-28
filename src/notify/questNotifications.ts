import { clockNow } from '../game/clock';
import * as Notifications from 'expo-notifications';

const ID = 'quest-return';

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelReturn(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID);
}

/** One fixed identifier, so rescheduling replaces rather than stacks. */
export async function scheduleReturn(endTime: Date): Promise<void> {
  await cancelReturn();
  if (endTime.getTime() <= clockNow().getTime()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: 'Habit Quest', body: 'Your hero has returned!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endTime },
  });
}
