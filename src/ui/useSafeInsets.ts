import { useContext } from 'react';
import { Platform } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * Safe-area insets that never collapse to 0 on iOS.
 * Inside native-tab screens and Modals the context can report 0 (react-native-screens), which put the
 * Home map button and the Customize "Done" button under the status bar, where iOS ignores taps.
 * We take the larger of the context value and the window insets iOS reported at launch.
 */
export function pickInsets(context: EdgeInsets | null, initial: EdgeInsets | null, os: string): EdgeInsets {
  const c = context ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const i = initial ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const top = Math.max(c.top, i.top, os === 'ios' ? 20 : 0);
  return { top, bottom: Math.max(c.bottom, i.bottom), left: Math.max(c.left, i.left), right: Math.max(c.right, i.right) };
}

export function useSafeInsets(): EdgeInsets {
  const context = useContext(SafeAreaInsetsContext);
  return pickInsets(context, initialWindowMetrics?.insets ?? null, Platform.OS);
}
