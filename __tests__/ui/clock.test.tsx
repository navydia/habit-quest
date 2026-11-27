import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useMinuteClock } from '@/src/ui/useMinuteClock';

test('the clock refreshes when the app comes back to the foreground', async () => {
  let handler: ((s: string) => void) | undefined;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_e, h: any) => {
    handler = h;
    return { remove: () => {} } as any;
  });
  jest.useFakeTimers({ now: new Date(2026, 10, 26, 23, 0) });
  const { result } = await renderHook(() => useMinuteClock());
  jest.setSystemTime(new Date(2026, 10, 27, 8, 0));
  await act(async () => handler?.('active'));
  expect(result.current.getDate()).toBe(27);
  jest.useRealTimers();
});
