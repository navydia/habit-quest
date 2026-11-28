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

test('the clock refreshes as soon as the debug menu moves time', async () => {
  const { useGameStore } = require('@/src/store/gameStore');
  const { newSave } = require('@/src/save/migrate');
  const { setClockOffset } = require('@/src/game/clock');
  useGameStore.setState({ save: newSave(), loaded: true });
  const { result } = await renderHook(() => useMinuteClock());
  const before = result.current.getTime();
  await act(async () => {
    setClockOffset(5 * 3600_000);
    useGameStore.setState({ save: { ...newSave(), dev: { offsetMs: 5 * 3600_000 } } });
  });
  expect(result.current.getTime() - before).toBeGreaterThan(4 * 3600_000);
  setClockOffset(0);
});
