import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useReducedMotion } from '@/src/theme/useTheme';

const HERO = { body: '#D8B48E', bodyShade: '#C29C77', cloak: '#3E5F66', cloakShade: '#33505A', scarf: '#B5543A', eye: '#2A2623', blush: '#E0937A' };

/**
 * Placeholder hero drawn in code, in the final style (style guide §7).
 * Replaced by the layered art system in Plan 2.
 */
export function HeroPlaceholder({ mode }: { mode: 'idle' | 'questing' }) {
  const reduced = useReducedMotion();
  const bob = useLoop(reduced ? 0 : 2400, Easing.inOut(Easing.sin));
  const swing = useLoop(mode === 'questing' && !reduced ? 900 : 0, Easing.inOut(Easing.quad));
  const look = useGlance(mode === 'idle' && !reduced);

  return (
    <View style={styles.wrap} accessible accessibilityLabel={mode === 'idle' ? 'Your hero, resting at home' : 'Your hero, out on a quest'}>
      {mode === 'questing' && <Slime reduced={reduced} />}
      <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }}>
        <Svg width={150} height={170} viewBox="0 0 120 136">
          <Ellipse cx="60" cy="130" rx="34" ry="5" fill="#000" opacity="0.18" />
          {/* cloak behind body */}
          <Path d="M24 70 Q60 52 96 70 L102 124 Q60 132 18 124 Z" fill={HERO.cloakShade} />
          {/* bean body */}
          <Ellipse cx="60" cy="78" rx="34" ry="44" fill={HERO.body} />
          <Ellipse cx="60" cy="104" rx="26" ry="16" fill={HERO.bodyShade} opacity="0.5" />
          {/* cloak front panels */}
          <Path d="M28 76 Q34 108 30 124 L46 126 Q40 100 44 78 Z" fill={HERO.cloak} />
          <Path d="M92 76 Q86 108 90 124 L74 126 Q80 100 76 78 Z" fill={HERO.cloak} />
          {/* scarf */}
          <Path d="M32 66 Q60 80 88 66 L88 74 Q60 88 32 74 Z" fill={HERO.scarf} />
          <Path d="M74 74 L80 96 L70 94 Z" fill={HERO.scarf} />
          {/* face */}
          <G transform={`translate(${look}, 0)`}>
            <Circle cx="48" cy="52" r="4.2" fill={HERO.eye} />
            <Circle cx="72" cy="52" r="4.2" fill={HERO.eye} />
            <Circle cx="49.4" cy="50.6" r="1.4" fill="#fff" />
            <Circle cx="73.4" cy="50.6" r="1.4" fill="#fff" />
          </G>
          <Ellipse cx="41" cy="60" rx="5" ry="2.6" fill={HERO.blush} opacity="0.6" />
          <Ellipse cx="79" cy="60" rx="5" ry="2.6" fill={HERO.blush} opacity="0.6" />
          <Path d="M56 60 Q60 63 64 60" stroke={HERO.eye} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
      {mode === 'questing' && (
        <Animated.View
          style={[
            styles.sword,
            { transform: [{ rotate: swing.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '25deg'] }) }] },
          ]}
        >
          <Svg width={34} height={78} viewBox="0 0 34 78">
            <Path d="M14 4 Q17 0 20 4 L20 50 L14 50 Z" fill="#D7DCE0" />
            <Rect x="6" y="50" width="22" height="5" rx="2.5" fill="#8C6A3F" />
            <Rect x="14" y="55" width="6" height="16" rx="2" fill="#5B4A43" />
            <Circle cx="17" cy="73" r="3.5" fill="#C9892B" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

function Slime({ reduced }: { reduced: boolean }) {
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
  const v = useRef(new Animated.Value(0)).current;
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

function useGlance(active: boolean) {
  const [look, setLook] = useState(0);
  useEffect(() => {
    if (!active) {
      setLook(0);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        setLook((l) => (l === 0 ? (Math.random() < 0.5 ? -2.5 : 2.5) : 0));
        next();
      }, 4000 + Math.random() * 3000);
    };
    next();
    return () => clearTimeout(timer);
  }, [active]);
  return look;
}

const styles = StyleSheet.create({
  wrap: { width: 230, height: 180, alignItems: 'center', justifyContent: 'flex-end' },
  sword: { position: 'absolute', right: 32, bottom: 50, transformOrigin: 'bottom' },
  slime: { position: 'absolute', right: -10, bottom: 6 },
});
