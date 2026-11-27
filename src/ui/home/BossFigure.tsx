import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

const TINTS: Record<string, { body: string; shade: string; eye: string }> = {
  'old-bramblehide': { body: '#8C6A4F', shade: '#5B4A43', eye: '#F6D18B' },
  'mire-witch': { body: '#4F6A5A', shade: '#33505A', eye: '#B9E0A8' },
  'granite-king': { body: '#8C877F', shade: '#5E5A55', eye: '#F0A06A' },
  'cinder-drake': { body: '#B5543A', shade: '#6B2F2A', eye: '#F6D18B' },
};

/** Placeholder boss: a big looming silhouette tinted per boss. Real boss art comes later. */
/** `inline`: drawn in normal layout at `size` (the boss preview), instead of looming at the right of the scene. */
export function BossFigure({ bossId, name, reduced, inline = false, size = 200 }: { bossId: string; name: string; reduced: boolean; inline?: boolean; size?: number }) {
  const tint = TINTS[bossId] ?? TINTS['old-bramblehide'];
  const [sway] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return;
    const step = (to: number) => Animated.timing(sway, { toValue: to, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [reduced, sway]);
  return (
    <Animated.View
      accessible
      accessibilityLabel={`${name}, the boss`}
      style={[inline ? { alignSelf: 'center' } : { position: 'absolute', right: -10, bottom: 0 }, { transform: [{ translateY: sway.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}
    >
      <Svg width={size} height={size * 1.15} viewBox="0 0 200 230">
        <Ellipse cx="100" cy="222" rx="80" ry="8" fill="#000" opacity="0.2" />
        <Path d="M20 220 Q10 120 60 70 Q100 30 140 70 Q190 120 180 220 Z" fill={tint.body} />
        <Path d="M40 220 Q40 150 70 120 L70 220 Z M160 220 Q160 150 130 120 L130 220 Z" fill={tint.shade} opacity="0.6" />
        <Path d="M60 70 L50 30 L78 60 Z M140 70 L150 30 L122 60 Z" fill={tint.shade} />
        <Circle cx="80" cy="105" r="9" fill={tint.eye} />
        <Circle cx="120" cy="105" r="9" fill={tint.eye} />
        <Circle cx="80" cy="107" r="4" fill="#2A2623" />
        <Circle cx="120" cy="107" r="4" fill="#2A2623" />
        <Path d="M78 140 Q100 128 122 140" stroke="#2A2623" strokeWidth="4" fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
