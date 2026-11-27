import { Text as RNText, type TextProps } from 'react-native';
import type { ColorTokens, TypeStyle } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';

type Props = TextProps & { variant?: TypeStyle; color?: keyof ColorTokens };

export function Text({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const { c, t } = useTheme();
  return <RNText {...rest} style={[t[variant], { color: c[color] }, style]} />;
}
