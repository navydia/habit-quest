import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Put at the root of every Modal's content. A Modal is its own native window, so safe-area insets
 * read from the screen behind it can be wrong (0 on iOS). That put the Customize "Done" button under
 * the status bar, where iOS ignores taps. Expo's docs: add SafeAreaProvider "at the root of any modals".
 */
export function ModalRoot({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
