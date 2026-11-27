import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/** The slime your hero fights while adventuring. Placeholder art in the final style. */
export function Slime({ reduced }: { reduced: boolean }) {
  const t = useLoop(reduced ? 0 : 3000, Easing.linear, false);
  const hop = t.interpolate({ inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1], outputRange: [40, 0, -10, 0, 0, 0, 40] });
  const squash = t.interpolate({ inputRange: [0, 0.45, 0.55, 0.7, 0.8, 1], outputRange: [1, 1, 0.7, 1.15, 0, 0] });
  return (
    <Animated.View style={[styles.slime, { opacity: reduced ? 1 : squash.interpolate({ inputRange: [0, 0.1, 2], outputRange: [0, 1, 1] }), transform: [{ translateX: hop }, { scaleY: reduced ? 1 : squash }] }]}>
      <Svg width={54} height={40} viewBox="0 0 54 40">
        <Path d="M4 36 Q2 10 27 6 Q52 10 50 36 Z" fill="#6E9A7C" />
        <Ellipse cx="18" cy="16" rx="6" ry="3" fill="#fff" opacity="0.35" />
        <Circle cx="21" cy="24" r="2.8" fill="#2A2623" />
        <Circle cx="33" cy="24" r="2.8" fill="#2A2623" />
      </Svg>
    </Animated.View>
  );
}

function useLoop(duration: number, easing: (v: number) => number, yoyo = true) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!duration) {
      v.setValue(0);
      return;
    }
    const step = (to: number) => Animated.timing(v, { toValue: to, duration: yoyo ? duration / 2 : duration, easing, useNativeDriver: true });
    const anim = Animated.loop(yoyo ? Animated.sequence([step(1), step(0)]) : Animated.sequence([step(1), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]));
    anim.start();
    return () => anim.stop();
  }, [duration, easing, v, yoyo]);
  return v;
}

const styles = StyleSheet.create({
  slime: { position: 'absolute', right: -10, bottom: 6 },
});
