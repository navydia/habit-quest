import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { lipHeight, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';

/** Card with the tactile look used across the app: darker lip below, light top highlight, soft shadow. */
export function TactileCard({ children, style, accent }: { children: ReactNode; style?: ViewStyle; accent?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ borderRadius: 24, backgroundColor: accent ?? c.line, paddingBottom: lipHeight, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <View style={[{ backgroundColor: c.surface, borderRadius: 24, borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.9)', padding: space.l, gap: space.s }, style]}>{children}</View>
    </View>
  );
}
