import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
};

export function Sheet({ visible, title, onClose, children, footer }: Props) {
  const { c } = useTheme();
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
                <View
                  style={[
                    styles.sheet,
                    {
                      backgroundColor: c.bg,
                      paddingBottom: insets.bottom + space.l,
                      borderTopLeftRadius: radius.sheet,
                      borderTopRightRadius: radius.sheet,
                    },
                  ]}
                >
                  <View style={[styles.grabber, { backgroundColor: c.line }]} />
                  <Text variant="title" accessibilityRole="header" style={{ marginBottom: space.l }}>
                    {title}
                  </Text>
                  <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
                  {footer ? <View style={{ paddingTop: space.m }}>{footer}</View> : null}
                </View>
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
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: space.l,
  },
});
