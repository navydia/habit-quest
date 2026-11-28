import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { pickInsets } from '@/src/ui/useSafeInsets';
import { ModalRoot } from './ModalRoot';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/** 'padding' on both platforms: Expo apps are edge-to-edge, so Android no longer resizes for the keyboard. */
export const sheetKeyboardBehavior = 'padding' as const;

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Pinned under the scrolling content, above the keyboard. */ footer?: ReactNode;
  /** A small control on the right of the title (e.g. Go to shop). */
  action?: ReactNode;
};

/** How far (pt) or how fast a pull on the handle must go to close the sheet. */
export const SHEET_DISMISS_DISTANCE = 100;
const SHEET_DISMISS_VELOCITY = 0.8;

/** A pull on the handle closes the sheet when it went far enough or was flicked fast enough. */
export function shouldDismissSheet(dy: number, vy: number): boolean {
  // A flick only counts once the sheet has actually moved down a little.
  return dy > SHEET_DISMISS_DISTANCE || (vy > SHEET_DISMISS_VELOCITY && dy > 12);
}

/** Drag-down-to-close for the sheet's handle area. `y` follows the finger (never above 0). */
export function useSheetDrag(onClose: () => void) {
  const [y] = useState(() => new Animated.Value(0));
  // The latest onClose, kept outside the responder so a re-render mid-drag doesn't rebuild it (and reset the drag).
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  }, [onClose]);
  // The ref is only read inside gesture callbacks, never while rendering (same pattern as HabitList's drag).
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      // The handle area has nothing tappable of its own, so it takes the touch from the start. The title's
      // action button sits deeper and answers first, so its taps still work.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      // Keep the drag once it starts (on web the scroll view would otherwise take it over).
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => y.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (shouldDismissSheet(g.dy, g.vy)) {
          Animated.timing(y, { toValue: 800, duration: 180, useNativeDriver: true }).start(() => {
            latest.current();
            y.setValue(0);
          });
        } else {
          Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(y, { toValue: 0, useNativeDriver: true }).start(),
    }),
  );
  return { y, handlers: responder.panHandlers };
}

export function Sheet({ visible, title, onClose, children, footer, action }: Props) {
  const { c } = useTheme();
  const drag = useSheetDrag(onClose);
  // Only mount while open: closing unmounts the Modal. Toggling `visible` on a mounted Modal can fail to
  // dismiss on iOS inside native tab screens (the Customize "Done" bug), so no Modal here stays mounted hidden.
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <ModalRoot>
        <SafeAreaInsetsContext.Consumer>
          {(measured) => {
            // Insets measured inside the Modal's own window (see ModalRoot).
            const insets = pickInsets(measured ?? NO_INSETS, initialWindowMetrics?.insets ?? null, Platform.OS);
            // Keeps inputs above the keyboard. 'padding' on both platforms (Android is edge-to-edge).
            return (
              <KeyboardAvoidingView behavior={sheetKeyboardBehavior} style={styles.root} testID="sheet-keyboard-avoider">
                <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.backdrop} onPress={onClose} />
                <Animated.View
                  style={[
                    { transform: [{ translateY: drag.y }] },
                    styles.sheet,
                    {
                      backgroundColor: c.bg,
                      paddingBottom: insets.bottom + space.l,
                      borderTopLeftRadius: radius.sheet,
                      borderTopRightRadius: radius.sheet,
                    },
                  ]}
                >
                  {/* Handle + title: drag down to close. */}
                  <View {...drag.handlers} testID="sheet-handle">
                    <View style={[styles.grabber, { backgroundColor: c.line }]} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, marginBottom: space.l }}>
                      <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
                        {title}
                      </Text>
                      {action}
                    </View>
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
                  {footer ? <View style={{ paddingTop: space.m }}>{footer}</View> : null}
                </Animated.View>
              </KeyboardAvoidingView>
            );
          }}
        </SafeAreaInsetsContext.Consumer>
      </ModalRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(20,16,12,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    paddingHorizontal: space.screen,
    paddingTop: space.m,
  },
  grabber: {
    // The visible bar is small; the whole handle area (with the title) takes the drag.
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: space.l,
  },
});
