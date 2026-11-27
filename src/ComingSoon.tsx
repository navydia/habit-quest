import { View } from 'react-native';
import { space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Text } from '@/src/ui/kit/Text';

export function ComingSoon({ title, detail }: { title: string; detail: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s, padding: space.screen, backgroundColor: c.bg }}>
      <Text variant="title" accessibilityRole="header">{title}</Text>
      <Text color="textMuted" style={{ textAlign: 'center' }}>{detail}</Text>
    </View>
  );
}
