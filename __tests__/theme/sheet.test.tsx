jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Sheet, sheetKeyboardBehavior } from '@/src/ui/kit/Sheet';

test('sheet content moves above the keyboard (padding behaviour, both platforms)', async () => {
  await render(
    <Sheet visible title="New habit" onClose={() => {}}>
      <Text>field</Text>
    </Sheet>,
  );
  expect(screen.getByTestId('sheet-keyboard-avoider')).toBeTruthy();
  expect(sheetKeyboardBehavior).toBe('padding');
  expect(screen.getByText('field')).toBeTruthy();
});
