jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light' },
}));

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '@/src/ui/kit/Button';
import { Checkbox } from '@/src/ui/kit/Checkbox';
import { ProgressBar } from '@/src/ui/kit/ProgressBar';

test('Button calls onPress and exposes its title to screen readers', async () => {
  const onPress = jest.fn();
  await render(<Button title="Set out" onPress={onPress} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Set out' }));
  expect(onPress).toHaveBeenCalled();
});

test('a disabled Button does nothing', async () => {
  const onPress = jest.fn();
  await render(<Button title="Set out" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByRole('button', { name: 'Set out' }));
  expect(onPress).not.toHaveBeenCalled();
});

test('Checkbox reports its checked state and toggles', async () => {
  const onToggle = jest.fn();
  await render(<Checkbox label="Read 20 min" checked onToggle={onToggle} />);
  const box = screen.getByRole('checkbox', { name: 'Read 20 min' });
  expect(box.props.accessibilityState.checked).toBe(true);
  await fireEvent.press(box);
  expect(onToggle).toHaveBeenCalled();
});

test('ProgressBar exposes its value', async () => {
  await render(<ProgressBar value={0.5} label="Quest gauge" />);
  expect(screen.getByRole('progressbar', { name: 'Quest gauge' }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
});
