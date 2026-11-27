import { act, render } from '@testing-library/react-native';
import { HeroSprite } from '@/src/ui/hero/HeroSprite';
import { newSave } from '@/src/save/migrate';

test('the fight animation does not tick while paused (hidden tab)', async () => {
  jest.useFakeTimers();
  const spy = jest.spyOn(globalThis, 'setInterval');
  await render(<HeroSprite player={newSave().player} anim="fight" paused />);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(spy.mock.calls.filter((args: unknown[]) => args[1] === 125)).toHaveLength(0);
  spy.mockRestore();
  jest.useRealTimers();
});
