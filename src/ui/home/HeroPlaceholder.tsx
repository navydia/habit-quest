import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useReducedMotion } from '@/src/theme/useTheme';

const HERO = {
  skin: '#E8C4A0',
  skinShade: '#D6AD86',
  hair: '#5A3E32',
  tunic: '#6E8B74',
  tunicShade: '#5C7862',
  trousers: '#4A4A58',
  boots: '#5B4A43',
  belt: '#5B4A43',
  buckle: '#C9892B',
  cloak: '#3E5F66',
  cloakShade: '#33505A',
  scarf: '#B5543A',
  eye: '#2A2623',
  blush: '#E0937A',
};

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
        <Svg width={150} height={200} viewBox="0 0 120 160">
          <Ellipse cx="60" cy="154" rx="30" ry="5" fill="#000" opacity="0.18" />
          {/* cloak, behind everything */}
          <Path d="M36 80 Q60 72 84 80 L94 146 Q60 152 26 146 Z" fill={HERO.cloakShade} />
          {/* legs and boots */}
          <Rect x="47" y="120" width="11" height="24" rx="5" fill={HERO.trousers} />
          <Rect x="62" y="120" width="11" height="24" rx="5" fill={HERO.trousers} />
          <Rect x="44" y="138" width="16" height="10" rx="5" fill={HERO.boots} />
          <Rect x="60" y="138" width="16" height="10" rx="5" fill={HERO.boots} />
          {/* arms */}
          <Rect x="29" y="84" width="12" height="34" rx="6" fill={HERO.tunicShade} />
          <Circle cx="35" cy="120" r="6" fill={HERO.skin} />
          <Rect x="79" y="84" width="12" height="34" rx="6" fill={HERO.tunicShade} />
          <Circle cx="85" cy="120" r="6" fill={HERO.skin} />
          {/* torso */}
          <Rect x="39" y="78" width="42" height="50" rx="16" fill={HERO.tunic} />
          <Rect x="39" y="110" width="42" height="6" fill={HERO.belt} />
          <Rect x="56" y="109" width="8" height="8" rx="2" fill={HERO.buckle} />
          {/* cloak edges framing the torso */}
          <Path d="M38 80 Q34 110 30 140 L38 141 Q40 112 44 82 Z" fill={HERO.cloak} />
          <Path d="M82 80 Q86 110 90 140 L82 141 Q80 112 76 82 Z" fill={HERO.cloak} />
          {/* scarf */}
          <Path d="M40 76 Q60 88 80 76 L80 84 Q60 96 40 84 Z" fill={HERO.scarf} />
          <Path d="M68 86 L74 104 L64 102 Z" fill={HERO.scarf} />
          {/* head */}
          <Circle cx="33" cy="54" r="5" fill={HERO.skinShade} />
          <Circle cx="87" cy="54" r="5" fill={HERO.skinShade} />
          <Circle cx="60" cy="50" r="28" fill={HERO.skin} />
          <Path d="M31 50 Q30 20 60 20 Q90 20 89 50 Q84 36 70 34 Q64 42 50 38 Q40 42 31 50 Z" fill={HERO.hair} />
          <G transform={`translate(${look}, 0)`}>
            <Circle cx="50" cy="55" r="3.8" fill={HERO.eye} />
            <Circle cx="70" cy="55" r="3.8" fill={HERO.eye} />
            <Circle cx="51.3" cy="53.7" r="1.3" fill="#fff" />
            <Circle cx="71.3" cy="53.7" r="1.3" fill="#fff" />
          </G>
          <Ellipse cx="43" cy="63" rx="4.5" ry="2.4" fill={HERO.blush} opacity="0.55" />
          <Ellipse cx="77" cy="63" rx="4.5" ry="2.4" fill={HERO.blush} opacity="0.55" />
          <Path d="M56 65 Q60 68 64 65" stroke={HERO.eye} strokeWidth="1.6" fill="none" strokeLinecap="round" />
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

function useGlance(active: boolean) {
  const [look, setLook] = useState(0);
  useEffect(() => {
    if (!active) return;
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
  return active ? look : 0;
}

const styles = StyleSheet.create({
  wrap: { width: 230, height: 210, alignItems: 'center', justifyContent: 'flex-end' },
  sword: { position: 'absolute', right: 64, bottom: 42, transformOrigin: 'bottom' },
  slime: { position: 'absolute', right: -10, bottom: 6 },
});
