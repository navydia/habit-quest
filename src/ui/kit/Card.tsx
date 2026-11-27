import { View, type ViewProps } from 'react-native';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';

/** `floating` cards sit over the scene and get the soft shadow; others get a hairline border. */
export function Card({ floating, style, ...rest }: ViewProps & { floating?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      {...rest}
      style={[
        { backgroundColor: c.surface, borderRadius: radius.card, padding: space.l },
        floating
          ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }
          : { borderWidth: 1, borderColor: c.line },
        style,
      ]}
    />
  );
}
