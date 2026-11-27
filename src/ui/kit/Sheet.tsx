import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from './Text';

/** 'padding' on both platforms: Expo apps are edge-to-edge, so Android no longer resizes for the keyboard. */
export const sheetKeyboardBehavior = 'padding' as const;

type Props = { visible: boolean; title: string; onClose: () => void; children: ReactNode };

export function Sheet({ visible, title, onClose, children }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Keeps inputs above the keyboard. 'padding' on both platforms (Android is edge-to-edge). */}
      <KeyboardAvoidingView behavior={sheetKeyboardBehavior} style={styles.root} testID="sheet-keyboard-avoider">
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: c.bg, paddingBottom: insets.bottom + space.l, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: c.line }]} />
          <Text variant="title" accessibilityRole="header" style={{ marginBottom: space.l }}>
            {title}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(20,16,12,0.45)' },
  sheet: { maxHeight: '88%', paddingHorizontal: space.screen, paddingTop: space.m },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: space.l },
});
